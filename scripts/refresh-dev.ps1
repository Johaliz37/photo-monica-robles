# Deja el proyecto Supabase de DESARROLLO como copia de producción:
#   1. aplica todas las migraciones en dev;
#   2. copia los datos del esquema public (salvo admins) de producción a dev;
#   3. copia los archivos de Storage (scripts/copy-storage.mjs);
#   4. crea (o reutiliza) un admin de pruebas en dev.
#
# Requiere Docker con Supabase local en marcha (npm run db:start): usa su pg_dump/psql 17.
# Uso:  powershell -ExecutionPolicy Bypass -File scripts/refresh-dev.ps1
# Las credenciales se piden por terminal y no se guardan en ningún sitio.
# Cadenas de conexión: Supabase → Connect → "Session pooler" (puerto 5432), con la contraseña de la BD.
$ErrorActionPreference = 'Stop'
$db = 'supabase_db_monica-robles-navidad'

function Ask([string]$label, [switch]$secret) {
  if ($secret) {
    $s = Read-Host $label -AsSecureString
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
  }
  return Read-Host $label
}

function Run([string]$what) {
  if ($LASTEXITCODE -ne 0) { throw "Falló: $what" }
}

if (-not (docker ps --format '{{.Names}}' | Select-String -SimpleMatch $db)) {
  throw "No está en marcha el contenedor $db (npm run db:start)"
}

$prodDb = Ask 'Cadena de conexión de PRODUCCIÓN (postgresql://...)' -secret
$devDb = Ask 'Cadena de conexión de DESARROLLO (postgresql://...)' -secret
$prodApi = (Ask 'URL de PRODUCCIÓN (https://xxx.supabase.co)').TrimEnd('/')
$devApi = (Ask 'URL de DESARROLLO (https://xxx.supabase.co)').TrimEnd('/')
$prodKey = Ask 'service_role / secret key de PRODUCCIÓN' -secret
$devKey = Ask 'service_role / secret key de DESARROLLO' -secret
$adminEmail = Ask 'Email del admin de pruebas en desarrollo'
$adminPassword = Ask 'Contraseña del admin de pruebas' -secret

if ($prodApi -eq $devApi -or $prodDb -eq $devDb) { throw 'Producción y desarrollo son el mismo proyecto' }
$devRef = ([Uri]$devApi).Host.Split('.')[0]
if ($devDb -notmatch [Regex]::Escape($devRef)) { throw "La cadena de DESARROLLO no es del proyecto $devRef" }
$ok = Read-Host "Se BORRARÁN los datos de $devApi y se sustituirán por los de $prodApi. Escribe $devRef para seguir"
if ($ok -ne $devRef) { throw 'Cancelado' }

Write-Host '1/4 Migraciones en desarrollo...'
npx -y supabase@latest db push --db-url $devDb --include-all --yes; Run 'supabase db push'

Write-Host '2/4 Datos de producción...'
# El volcado vive solo dentro del contenedor y se borra al terminar (contiene datos personales)
docker exec $db pg_dump $prodDb --data-only --schema=public --exclude-table=public.admins --no-owner --no-privileges -f /tmp/prod-data.sql; Run 'pg_dump'
try {
  # Vacía las tablas de dev (incluidas las semillas de las migraciones: packages, profile) y carga el volcado
  $truncate = "do `$`$ declare t text; begin select string_agg(format('public.%I', tablename), ', ') into t from pg_tables where schemaname = 'public' and tablename <> 'admins'; if t is not null then execute 'truncate ' || t || ' cascade'; end if; end `$`$;"
  docker exec $db psql $devDb -v ON_ERROR_STOP=1 -q -c $truncate; Run 'truncate'
  docker exec $db psql $devDb -v ON_ERROR_STOP=1 -q -1 -f /tmp/prod-data.sql; Run 'carga del volcado'
} finally {
  docker exec $db rm -f /tmp/prod-data.sql
}

Write-Host '3/4 Archivos de Storage...'
$env:SRC_SUPABASE_URL = $prodApi; $env:SRC_SERVICE_ROLE_KEY = $prodKey
$env:DST_SUPABASE_URL = $devApi; $env:DST_SERVICE_ROLE_KEY = $devKey
try {
  node scripts/copy-storage.mjs --yes; Run 'copy-storage'
} finally {
  Remove-Item Env:SRC_SERVICE_ROLE_KEY, Env:DST_SERVICE_ROLE_KEY
}

Write-Host '4/4 Admin de pruebas...'
$headers = @{ apikey = $devKey; Authorization = "Bearer $devKey" }
$users = (Invoke-RestMethod "$devApi/auth/v1/admin/users?per_page=1000" -Headers $headers).users
$user = $users | Where-Object { $_.email -eq $adminEmail } | Select-Object -First 1
if (-not $user) {
  $body = @{ email = $adminEmail; password = $adminPassword; email_confirm = $true } | ConvertTo-Json
  $user = Invoke-RestMethod -Method Post "$devApi/auth/v1/admin/users" -Headers $headers -ContentType 'application/json' -Body $body
}
docker exec $db psql $devDb -v ON_ERROR_STOP=1 -q -c "insert into public.admins values ('$($user.id)') on conflict do nothing;"; Run 'alta del admin'

Write-Host "Listo: $devApi es una copia de producción. Admin de pruebas: $adminEmail"
