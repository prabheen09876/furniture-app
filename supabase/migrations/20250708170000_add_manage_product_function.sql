-- Create a function to manage product and its images in a transaction
CREATE OR REPLACE FUNCTION public.manage_product_with_images(
  p_product_data JSONB,
  p_images JSONB[],
  p_deleted_image_ids UUID[] DEFAULT '{}',
  p_product_id UUID DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_result JSONB;
  v_image JSONB;
  v_sort_order INTEGER;
  v_image_id UUID;
  v_deleted_image_id UUID;
BEGIN
  -- Start a transaction
  BEGIN
    -- Update or insert the product
    IF p_product_id IS NOT NULL THEN
      -- Update existing product
      UPDATE public.products
      SET 
        name = p_product_data->>'name',
        description = NULLIF(p_product_data->>'description', ''),
        price = (p_product_data->>'price')::NUMERIC,
        original_price = NULLIF(p_product_data->>'original_price', '')::NUMERIC,
        image_url = p_product_data->>'image_url',
        category = p_product_data->>'category',
        sku = p_product_data->>'sku',
        brand = NULLIF(p_product_data->>'brand', ''),
        stock_quantity = (p_product_data->>'stock_quantity')::INTEGER,
        is_active = (p_product_data->>'is_active')::BOOLEAN,
        updated_at = NOW()
      WHERE id = p_product_id
      RETURNING id INTO v_product_id;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
      END IF;
      
      -- Delete removed images
      FOREACH v_deleted_image_id IN ARRAY p_deleted_image_ids LOOP
        DELETE FROM public.product_images 
        WHERE id = v_deleted_image_id AND product_id = v_product_id;
      END LOOP;
    ELSE
      -- Insert new product
      INSERT INTO public.products (
        name, 
        description, 
        price, 
        original_price, 
        image_url, 
        category, 
        sku, 
        brand, 
        stock_quantity, 
        is_active
      ) VALUES (
        p_product_data->>'name',
        NULLIF(p_product_data->>'description', ''),
        (p_product_data->>'price')::NUMERIC,
        NULLIF(p_product_data->>'original_price', '')::NUMERIC,
        p_product_data->>'image_url',
        p_product_data->>'category',
        p_product_data->>'sku',
        NULLIF(p_product_data->>'brand', ''),
        (p_product_data->>'stock_quantity')::INTEGER,
        (p_product_data->>'is_active')::BOOLEAN
      )
      RETURNING id INTO v_product_id;
    END IF;
    
    -- Update or insert images
    v_sort_order := 0;
    
    -- First, delete all existing images for this product if this is an update
    -- We'll recreate them with the new sort order
    IF p_product_id IS NOT NULL THEN
      DELETE FROM public.product_images 
      WHERE product_id = v_product_id 
      AND id <> ALL(p_deleted_image_ids);
    END IF;
    
    -- Insert or update images
    FOREACH v_image IN ARRAY p_images LOOP
      IF v_image->>'id' IS NOT NULL THEN
        -- Update existing image
        UPDATE public.product_images
        SET 
          image_url = v_image->>'image_url',
          alt_text = NULLIF(v_image->>'alt_text', ''),
          sort_order = v_sort_order,
          updated_at = NOW()
        WHERE id = (v_image->>'id')::UUID
        AND product_id = v_product_id
        RETURNING id INTO v_image_id;
        
        IF NOT FOUND THEN
          -- If the image doesn't exist, insert it
          INSERT INTO public.product_images (
            product_id, 
            image_url, 
            alt_text, 
            sort_order
          ) VALUES (
            v_product_id,
            v_image->>'image_url',
            NULLIF(v_image->>'alt_text', ''),
            v_sort_order
          )
          RETURNING id INTO v_image_id;
        END IF;
      ELSE
        -- Insert new image
        INSERT INTO public.product_images (
          product_id, 
          image_url, 
          alt_text, 
          sort_order
        ) VALUES (
          v_product_id,
          v_image->>'image_url',
          NULLIF(v_image->>'alt_text', ''),
          v_sort_order
        )
        RETURNING id INTO v_image_id;
      END IF;
      
      v_sort_order := v_sort_order + 1;
    END LOOP;
    
    -- Return success with the product ID
    SELECT jsonb_build_object(
      'success', true,
      'product_id', v_product_id,
      'message', CASE 
        WHEN p_product_id IS NOT NULL THEN 'Product updated successfully' 
        ELSE 'Product created successfully' 
      END
    ) INTO v_result;
    
    RETURN v_result;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction on error
      RAISE EXCEPTION 'Error managing product: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.manage_product_with_images(JSONB, JSONB[], UUID[], UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.manage_product_with_images IS 'Manages product and its images in a single transaction. ';

-- Add example usage as a comment
-- SELECT * FROM public.manage_product_with_images(
--   '{"name":"Test Product","description":"Test Description","price":"99.99","original_price":"","image_url":"https://example.com/image.jpg","category":"chairs","sku":"TEST-123","brand":"Test Brand","stock_quantity":"10","is_active":true}'::jsonb,
--   ARRAY[
--     '{"id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0", "image_url": "https://example.com/image1.jpg", "alt_text": "Main product image"}',
--     '{"image_url": "https://example.com/image2.jpg", "alt_text": "Additional view"}'
--   ]::jsonb[],
--   ARRAY['b2c3d4e5-f6a7-8901-2345-6789abcdef01']::uuid[], -- IDs of images to delete
--   'a1b2c3d4-e5f6-7890-1234-56789abcdef0'::uuid -- Existing product ID (NULL for new product)
-- );
