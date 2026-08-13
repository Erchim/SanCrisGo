insert into public.tags (name, slug) values
  ('Hidden gem', 'hidden-gem'), ('Live music', 'live-music'), ('Budget', 'budget'),
  ('Family friendly', 'family-friendly'), ('Remote work', 'remote-work'),
  ('Vegetarian friendly', 'vegetarian-friendly'), ('Rainy day', 'rainy-day'),
  ('Nature', 'nature'), ('Nightlife', 'nightlife')
on conflict (slug) do nothing;
