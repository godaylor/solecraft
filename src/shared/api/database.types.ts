export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      brand_size_guide_entries: {
        Row: {
          brand_id: string
          foot_length_max_mm: number | null
          foot_length_min_mm: number | null
          provenance: Database['public']['Enums']['data_provenance']
          reviewed_at: string | null
          size_id: string
          source_note: string | null
        }
        Insert: {
          brand_id: string
          foot_length_max_mm?: number | null
          foot_length_min_mm?: number | null
          provenance?: Database['public']['Enums']['data_provenance']
          reviewed_at?: string | null
          size_id: string
          source_note?: string | null
        }
        Update: {
          brand_id?: string
          foot_length_max_mm?: number | null
          foot_length_min_mm?: number | null
          provenance?: Database['public']['Enums']['data_provenance']
          reviewed_at?: string | null
          size_id?: string
          source_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'brand_size_guide_entries_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brand_size_guide_entries_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['brand_id']
          },
          {
            foreignKeyName: 'brand_size_guide_entries_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'product_details'
            referencedColumns: ['brand_id']
          },
          {
            foreignKeyName: 'brand_size_guide_entries_size_id_fkey'
            columns: ['size_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['size_id']
          },
          {
            foreignKeyName: 'brand_size_guide_entries_size_id_fkey'
            columns: ['size_id']
            isOneToOne: false
            referencedRelation: 'sizes'
            referencedColumns: ['id']
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          inventory_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          inventory_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          inventory_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey'
            columns: ['cart_id']
            isOneToOne: false
            referencedRelation: 'carts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cart_items_inventory_id_fkey'
            columns: ['inventory_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['inventory_id']
          },
          {
            foreignKeyName: 'cart_items_inventory_id_fkey'
            columns: ['inventory_id']
            isOneToOne: false
            referencedRelation: 'inventory'
            referencedColumns: ['id']
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          size_id: string
          sku: string
          stock_on_hand: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          id: string
          size_id: string
          sku: string
          stock_on_hand?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          id?: string
          size_id?: string
          sku?: string
          stock_on_hand?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_size_id_fkey'
            columns: ['size_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['size_id']
          },
          {
            foreignKeyName: 'inventory_size_id_fkey'
            columns: ['size_id']
            isOneToOne: false
            referencedRelation: 'sizes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inventory_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['variant_id']
          },
          {
            foreignKeyName: 'inventory_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['default_variant_id']
          },
          {
            foreignKeyName: 'inventory_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
          },
        ]
      }
      order_addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string
          order_id: string
          postal_code: string | null
          recipient_name: string
        }
        Insert: {
          address_line: string
          city: string
          created_at?: string
          order_id: string
          postal_code?: string | null
          recipient_name: string
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string
          order_id?: string
          postal_code?: string | null
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_addresses_order_id_fkey'
            columns: ['order_id']
            isOneToOne: true
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          brand_name_snapshot: string
          color_snapshot: string
          created_at: string
          currency: string
          id: string
          inventory_id: string | null
          line_total_minor: number
          order_id: string
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          size_snapshot: string
          sku_snapshot: string
          unit_price_minor: number
        }
        Insert: {
          brand_name_snapshot: string
          color_snapshot: string
          created_at?: string
          currency: string
          id?: string
          inventory_id?: string | null
          line_total_minor: number
          order_id: string
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          size_snapshot: string
          sku_snapshot: string
          unit_price_minor: number
        }
        Update: {
          brand_name_snapshot?: string
          color_snapshot?: string
          created_at?: string
          currency?: string
          id?: string
          inventory_id?: string | null
          line_total_minor?: number
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          size_snapshot?: string
          sku_snapshot?: string
          unit_price_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_inventory_id_fkey'
            columns: ['inventory_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['inventory_id']
          },
          {
            foreignKeyName: 'order_items_inventory_id_fkey'
            columns: ['inventory_id']
            isOneToOne: false
            referencedRelation: 'inventory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['product_id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string
          currency: string
          delivery_minor: number
          id: string
          idempotency_key: string
          order_number: string
          payment_scenario: string
          placed_at: string
          status: Database['public']['Enums']['order_status']
          subtotal_minor: number
          total_minor: number
          user_id: string | null
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          currency: string
          delivery_minor: number
          id?: string
          idempotency_key: string
          order_number: string
          payment_scenario: string
          placed_at?: string
          status?: Database['public']['Enums']['order_status']
          subtotal_minor: number
          total_minor: number
          user_id?: string | null
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          currency?: string
          delivery_minor?: number
          id?: string
          idempotency_key?: string
          order_number?: string
          payment_scenario?: string
          placed_at?: string
          status?: Database['public']['Enums']['order_status']
          subtotal_minor?: number
          total_minor?: number
          user_id?: string | null
        }
        Relationships: []
      }
      product_media: {
        Row: {
          alt: string
          created_at: string
          height: number
          id: string
          kind: Database['public']['Enums']['media_kind']
          position: number
          storage_path: string
          variant_id: string
          width: number
        }
        Insert: {
          alt: string
          created_at?: string
          height: number
          id: string
          kind?: Database['public']['Enums']['media_kind']
          position?: number
          storage_path: string
          variant_id: string
          width: number
        }
        Update: {
          alt?: string
          created_at?: string
          height?: number
          id?: string
          kind?: Database['public']['Enums']['media_kind']
          position?: number
          storage_path?: string
          variant_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: 'product_media_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['variant_id']
          },
          {
            foreignKeyName: 'product_media_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['default_variant_id']
          },
          {
            foreignKeyName: 'product_media_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
          },
        ]
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_tags_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['product_id']
          },
          {
            foreignKeyName: 'product_tags_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_tags_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_tags_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      product_variants: {
        Row: {
          color_code: string
          color_name: string
          color_slug: string
          compare_at_minor: number | null
          created_at: string
          currency: string
          id: string
          is_default: boolean
          price_minor: number
          product_id: string
          slug: string
        }
        Insert: {
          color_code: string
          color_name: string
          color_slug: string
          compare_at_minor?: number | null
          created_at?: string
          currency?: string
          id: string
          is_default?: boolean
          price_minor: number
          product_id: string
          slug: string
        }
        Update: {
          color_code?: string
          color_name?: string
          color_slug?: string
          compare_at_minor?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_default?: boolean
          price_minor?: number
          product_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['product_id']
          },
          {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          cushioning: Database['public']['Enums']['cushioning']
          description: string
          fit_note: Database['public']['Enums']['fit_note']
          fit_provenance: Database['public']['Enums']['data_provenance']
          fit_reviewed_at: string | null
          fit_source_note: string | null
          fit_width: Database['public']['Enums']['fit_width']
          id: string
          merch_rank: number
          model: string
          published_at: string | null
          slug: string
          status: Database['public']['Enums']['product_status']
          support_level: Database['public']['Enums']['support_level']
          title: string
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          cushioning?: Database['public']['Enums']['cushioning']
          description: string
          fit_note?: Database['public']['Enums']['fit_note']
          fit_provenance?: Database['public']['Enums']['data_provenance']
          fit_reviewed_at?: string | null
          fit_source_note?: string | null
          fit_width?: Database['public']['Enums']['fit_width']
          id: string
          merch_rank?: number
          model: string
          published_at?: string | null
          slug: string
          status?: Database['public']['Enums']['product_status']
          support_level?: Database['public']['Enums']['support_level']
          title: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          cushioning?: Database['public']['Enums']['cushioning']
          description?: string
          fit_note?: Database['public']['Enums']['fit_note']
          fit_provenance?: Database['public']['Enums']['data_provenance']
          fit_reviewed_at?: string | null
          fit_source_note?: string | null
          fit_width?: Database['public']['Enums']['fit_width']
          id?: string
          merch_rank?: number
          model?: string
          published_at?: string | null
          slug?: string
          status?: Database['public']['Enums']['product_status']
          support_level?: Database['public']['Enums']['support_level']
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['brand_id']
          },
          {
            foreignKeyName: 'products_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'product_details'
            referencedColumns: ['brand_id']
          },
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['category_id']
          },
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'product_details'
            referencedColumns: ['category_id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sizes: {
        Row: {
          display_label: string
          id: string
          sort_order: number
          system: string
          value: number
        }
        Insert: {
          display_label: string
          id: string
          sort_order: number
          system: string
          value: number
        }
        Update: {
          display_label?: string
          id?: string
          sort_order?: number
          system?: string
          value?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          type: Database['public']['Enums']['tag_type']
        }
        Insert: {
          created_at?: string
          id: string
          label: string
          slug: string
          type: Database['public']['Enums']['tag_type']
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          type?: Database['public']['Enums']['tag_type']
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wishlist_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'cart_inventory_items'
            referencedColumns: ['product_id']
          },
          {
            foreignKeyName: 'wishlist_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'catalog_products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'wishlist_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'wishlist_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      cart_inventory_items: {
        Row: {
          brand_name: string | null
          color_name: string | null
          color_slug: string | null
          compare_at_minor: number | null
          currency: string | null
          image_alt: string | null
          image_height: number | null
          image_path: string | null
          image_width: number | null
          inventory_id: string | null
          inventory_updated_at: string | null
          model: string | null
          price_minor: number | null
          product_id: string | null
          product_slug: string | null
          size_id: string | null
          size_label: string | null
          sku: string | null
          stock_on_hand: number | null
          title: string | null
          variant_id: string | null
          variant_slug: string | null
        }
        Relationships: []
      }
      catalog_products: {
        Row: {
          available_sizes: string[] | null
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          color_names: string[] | null
          color_slugs: string[] | null
          compare_at_minor: number | null
          currency: string | null
          cushioning: Database['public']['Enums']['cushioning'] | null
          default_color_code: string | null
          default_color_name: string | null
          default_color_slug: string | null
          default_variant_id: string | null
          default_variant_slug: string | null
          description: string | null
          fit_note: Database['public']['Enums']['fit_note'] | null
          fit_provenance: Database['public']['Enums']['data_provenance'] | null
          fit_reviewed_at: string | null
          fit_source_note: string | null
          fit_width: Database['public']['Enums']['fit_width'] | null
          id: string | null
          image_alt: string | null
          image_height: number | null
          image_path: string | null
          image_width: number | null
          in_stock: boolean | null
          merch_rank: number | null
          model: string | null
          price_max_minor: number | null
          price_min_minor: number | null
          price_minor: number | null
          published_at: string | null
          search_document: unknown
          slug: string | null
          support_level: Database['public']['Enums']['support_level'] | null
          title: string | null
          total_stock: number | null
          use_case_labels: string[] | null
          use_case_slugs: string[] | null
        }
        Relationships: []
      }
      product_details: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          cushioning: Database['public']['Enums']['cushioning'] | null
          description: string | null
          fit_note: Database['public']['Enums']['fit_note'] | null
          fit_provenance: Database['public']['Enums']['data_provenance'] | null
          fit_reviewed_at: string | null
          fit_source_note: string | null
          fit_width: Database['public']['Enums']['fit_width'] | null
          id: string | null
          model: string | null
          size_guide: Json | null
          slug: string | null
          support_level: Database['public']['Enums']['support_level'] | null
          title: string | null
          use_cases: Json | null
          variants: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_order: {
        Args: {
          p_contact: Json
          p_delivery: Json
          p_idempotency_key: string
          p_lines: Json
          p_payment_scenario: string
        }
        Returns: Json
      }
      merge_guest_commerce: {
        Args: { p_cart?: Json; p_wishlist?: string[] }
        Returns: Json
      }
      read_guest_receipt: {
        Args: { p_order_number: string; p_token: string }
        Returns: Json
      }
    }
    Enums: {
      cushioning: 'firm' | 'balanced' | 'soft' | 'unknown'
      data_provenance: 'manufacturer' | 'editorial_demo' | 'unknown'
      fit_note: 'runs_small' | 'true_to_size' | 'runs_large' | 'unknown'
      fit_width: 'narrow' | 'standard' | 'wide' | 'extra_wide' | 'unknown'
      media_kind: 'catalog' | 'gallery'
      order_status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
      product_status: 'draft' | 'published' | 'archived'
      support_level: 'flexible' | 'balanced' | 'structured' | 'unknown'
      tag_type: 'use_case' | 'collection'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cushioning: ['firm', 'balanced', 'soft', 'unknown'],
      data_provenance: ['manufacturer', 'editorial_demo', 'unknown'],
      fit_note: ['runs_small', 'true_to_size', 'runs_large', 'unknown'],
      fit_width: ['narrow', 'standard', 'wide', 'extra_wide', 'unknown'],
      media_kind: ['catalog', 'gallery'],
      order_status: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
      product_status: ['draft', 'published', 'archived'],
      support_level: ['flexible', 'balanced', 'structured', 'unknown'],
      tag_type: ['use_case', 'collection'],
    },
  },
} as const
