-- =====================================================================
-- create_booking: serializa las reservas con un bloqueo de transacción.
--
-- Con dos reservas simultáneas al mismo hueco, la restricción de exclusión
-- bookings_no_overlap a veces se resuelve con un deadlock (40P01) en vez de
-- exclusion_violation: la integridad se mantiene, pero el perdedor recibía un
-- error genérico en lugar de SLOT_TAKEN. Con el bloqueo, la segunda petición
-- espera a la primera y falla limpiamente con SLOT_TAKEN. El volumen de
-- reservas es mínimo, así que serializar no tiene coste apreciable.
--
-- Única diferencia con 0001: el paso 7 empieza con pg_advisory_xact_lock.
-- =====================================================================

create or replace function public.create_booking(
  p_package_code text,
  p_baby_extension boolean,
  p_starts_at timestamptz,
  p_client_name text,
  p_email text,
  p_phone text,
  p_participants text,
  p_notes text,
  p_receipt_path text,
  p_privacy_consent boolean
) returns uuid
  language plpgsql volatile security definer set search_path = public as $$
declare
  v_pkg     packages%rowtype;
  v_baby    boolean := coalesce(p_baby_extension, false);
  v_dur     int;
  v_end     timestamptz;
  v_blocked timestamptz;
  v_name    text := trim(p_client_name);
  v_email   text := lower(trim(p_email));
  v_phone   text := replace(trim(p_phone), ' ', '');
  v_part    text := trim(p_participants);
  v_notes   text := nullif(trim(p_notes), '');
  v_receipt text := trim(p_receipt_path);
  v_price   int;
  v_id      uuid;
begin
  -- 1. Consentimiento
  if p_privacy_consent is not true then
    raise exception 'CONSENT_REQUIRED';
  end if;

  -- 2. Paquete
  select * into v_pkg from packages where code = p_package_code;
  if not found then
    raise exception 'INVALID_PACKAGE';
  end if;

  -- 3. Duración y bloqueo (sesión + margen)
  v_dur     := v_pkg.duration_min + case when v_baby then cfg_baby_extra_min() else 0 end;
  v_end     := p_starts_at + make_interval(mins => v_dur);
  v_blocked := v_end + make_interval(mins => cfg_buffer_min());

  -- 4. Antelación mínima
  if p_starts_at is null or p_starts_at <= now() + cfg_min_notice() then
    raise exception 'PAST_TIME';
  end if;

  -- 5. Dentro de una franja y alineada al paso
  if not exists (
    select 1 from availability_windows w
    where w.starts_at <= p_starts_at and v_end <= w.ends_at
      and mod(extract(epoch from p_starts_at - w.starts_at)::bigint, cfg_step_min() * 60) = 0
  ) then
    raise exception 'OUT_OF_WINDOW';
  end if;

  -- 6. Comprobante subido
  if v_receipt is null
     or v_receipt !~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$'
     or not exists (select 1 from storage.objects o where o.bucket_id = 'receipts' and o.name = v_receipt) then
    raise exception 'RECEIPT_MISSING';
  end if;

  -- Una reserva cada vez (evita deadlocks en la restricción de exclusión y
  -- que dos peticiones a la vez esquiven el límite de pendientes)
  perform pg_advisory_xact_lock(hashtext('public.create_booking'));

  -- 7. Límite de reservas pendientes por cliente
  if (select count(*) from bookings b
      where b.status = 'pendiente' and (lower(b.email) = v_email or b.phone = v_phone)) >= 3 then
    raise exception 'TOO_MANY_PENDING';
  end if;

  -- 8. Precio (lo calcula el servidor)
  v_price := case when now() between cfg_presale_starts() and cfg_presale_ends()
                  then v_pkg.presale_price_cents else v_pkg.price_cents end
           + case when v_baby then cfg_baby_extra_cents() else 0 end;

  -- 9. Insertar
  begin
    insert into bookings (package_code, baby_extension, starts_at, ends_at, blocked_until,
                          price_cents, deposit_cents, client_name, email, phone,
                          participants, notes, receipt_path, privacy_consent_at)
    values (v_pkg.code, v_baby, p_starts_at, v_end, v_blocked,
            v_price, cfg_deposit_cents(), v_name, v_email, v_phone,
            v_part, v_notes, v_receipt, now())
    returning id into v_id;
  exception
    when exclusion_violation then
      raise exception 'SLOT_TAKEN';
    when unique_violation then
      raise exception 'RECEIPT_REUSED';
    when check_violation or not_null_violation then
      raise exception 'INVALID_DATA';
  end;

  return v_id;
end $$;
