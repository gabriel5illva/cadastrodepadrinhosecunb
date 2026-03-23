create table public.padrinhos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text not null unique,
  telefone text,
  foto_perfil text not null,
  fotos_itens text[] not null default '{}',
  created_at timestamptz default now()
);

alter table padrinhos
  alter column foto_perfil set not null,
  alter column fotos_itens set not null,
  alter column fotos_itens set default '{}';

alter table padrinhos
  add constraint fotos_itens_min check (cardinality(fotos_itens) between 1 and 2);
