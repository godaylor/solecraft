alter table public.order_items
  alter constraint order_items_product_id_fkey deferrable initially deferred;

alter table public.order_items
  alter constraint order_items_inventory_id_fkey deferrable initially deferred;

comment on constraint order_items_product_id_fkey on public.order_items is
  'Deferred so catalog deletion can detach product and inventory references atomically while preserving snapshots.';
comment on constraint order_items_inventory_id_fkey on public.order_items is
  'Deferred so cascade deletion settles before immutable order snapshot references are checked.';
