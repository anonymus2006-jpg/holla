create table participantes (
  id bigint primary key generated always as identity,
  nombre text not null check (char_length(nombre) <= 100),
  apellido text not null check (char_length(apellido) <= 100),
  edad int not null check (edad between 0 and 120),
  telefono text not null check (
    char_length(telefono) <= 20
    and telefono ~ E'^\\+?[0-9\\-]+$'
  ),
  correo text not null check (char_length(correo) <= 150),
  fecha_inscripcion timestamptz default now()
);
