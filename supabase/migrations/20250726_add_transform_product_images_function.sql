-- Create function to transform and insert product images
CREATE OR REPLACE FUNCTION transform_product_images(
  images_json jsonb,
  product_id_param uuid
)
RETURNS void AS $$
BEGIN
  INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
  SELECT 
    product_id_param as product_id,
    (image_data->>'image_url')::text as image_url,
    COALESCE((image_data->>'alt_text')::text, 'Product image') as alt_text,
    (row_number() OVER () - 1)::integer as sort_order
  FROM jsonb_array_elements(images_json) as image_data
  WHERE (image_data->>'image_url') IS NOT NULL 
    AND (image_data->>'image_url') != '';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION transform_product_images(jsonb, uuid) TO authenticated;

-- Example usage:
-- INSERT INTO product_images 
-- SELECT * FROM transform_product_images(
--     '[{"image_url": "http://example.com", "alt_text": "Sample"}]'::jsonb, 
--     'product-123'::uuid
-- );
