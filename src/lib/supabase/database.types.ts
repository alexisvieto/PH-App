export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          organization_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          organization_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          organization_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          building_id: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          published_at: string
          title: string
        }
        Insert: {
          body: string
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          published_at?: string
          title: string
        }
        Update: {
          body?: string
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          published_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_announcements_building_org"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          name: string
          organization_id: string
          settings: Json
          timezone: string
          total_units: number | null
          type: Database["public"]["Enums"]["building_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name: string
          organization_id: string
          settings?: Json
          timezone?: string
          total_units?: number | null
          type?: Database["public"]["Enums"]["building_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name?: string
          organization_id?: string
          settings?: Json
          timezone?: string
          total_units?: number | null
          type?: Database["public"]["Enums"]["building_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          amount: number
          building_id: string
          concept: Database["public"]["Enums"]["charge_concept"]
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          period: string | null
          unit_id: string
        }
        Insert: {
          amount: number
          building_id: string
          concept?: Database["public"]["Enums"]["charge_concept"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          period?: string | null
          unit_id: string
        }
        Update: {
          amount?: number
          building_id?: string
          concept?: Database["public"]["Enums"]["charge_concept"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          period?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          building_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string
          id: string
          organization_id: string
          spent_on: string
          supplier: string | null
        }
        Insert: {
          amount: number
          building_id: string
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          organization_id: string
          spent_on?: string
          supplier?: string | null
        }
        Update: {
          amount?: number
          building_id?: string
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          organization_id?: string
          spent_on?: string
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_settings: {
        Row: {
          base_amount: number
          building_id: string
          created_by: string | null
          currency: string
          id: string
          method: Database["public"]["Enums"]["fee_method"]
          organization_id: string
          updated_at: string
        }
        Insert: {
          base_amount?: number
          building_id: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["fee_method"]
          organization_id: string
          updated_at?: string
        }
        Update: {
          base_amount?: number
          building_id?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["fee_method"]
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_settings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: true
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          brand_accent: string | null
          brand_dark: string | null
          brand_primary: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          export_credit: boolean
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          slug: string
          tax_id: string | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_accent?: string | null
          brand_dark?: string | null
          brand_primary?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          export_credit?: boolean
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          slug: string
          tax_id?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_accent?: string | null
          brand_dark?: string | null
          brand_primary?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          export_credit?: boolean
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          tax_id?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          building_id: string
          created_at: string
          created_by: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          organization_id: string
          paid_on: string
          reference: string | null
          unit_id: string
        }
        Insert: {
          amount: number
          building_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id: string
          paid_on?: string
          reference?: string | null
          unit_id: string
        }
        Update: {
          amount?: number
          building_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          paid_on?: string
          reference?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          created_at: string
          created_by: string | null
          doc_number: string | null
          doc_type: Database["public"]["Enums"]["doc_type"] | null
          email: string | null
          full_name: string
          id: string
          kyc: Json
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type"] | null
          email?: string | null
          full_name: string
          id?: string
          kyc?: Json
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type"] | null
          email?: string | null
          full_name?: string
          id?: string
          kyc?: Json
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          doc_number: string | null
          doc_type: Database["public"]["Enums"]["doc_type"] | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type"] | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type"] | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          organization_id: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          organization_id: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          building_id: string
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          building_id: string
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          building_id?: string
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_leases: {
        Row: {
          building_id: string
          created_at: string
          created_by: string | null
          currency: string
          end_date: string | null
          id: string
          is_active: boolean
          kyc: Json
          organization_id: string
          owner_person_id: string | null
          rent_amount: number | null
          start_date: string | null
          tenant_person_id: string
          unit_id: string
        }
        Insert: {
          building_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          kyc?: Json
          organization_id: string
          owner_person_id?: string | null
          rent_amount?: number | null
          start_date?: string | null
          tenant_person_id: string
          unit_id: string
        }
        Update: {
          building_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          kyc?: Json
          organization_id?: string
          owner_person_id?: string | null
          rent_amount?: number | null
          start_date?: string | null
          tenant_person_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_leases_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_leases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_leases_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_leases_tenant_person_id_fkey"
            columns: ["tenant_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_ownerships: {
        Row: {
          acquired_on: string | null
          building_id: string
          created_at: string
          created_by: string | null
          ended_on: string | null
          id: string
          is_active: boolean
          organization_id: string
          person_id: string
          share: number
          unit_id: string
        }
        Insert: {
          acquired_on?: string | null
          building_id: string
          created_at?: string
          created_by?: string | null
          ended_on?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          person_id: string
          share?: number
          unit_id: string
        }
        Update: {
          acquired_on?: string | null
          building_id?: string
          created_at?: string
          created_by?: string | null
          ended_on?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          person_id?: string
          share?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_ownerships_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_ownerships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_ownerships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_ownerships_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area_m2: number | null
          building_id: string
          code: string
          coefficient: number
          created_at: string
          created_by: string | null
          floor: string | null
          id: string
          notes: string | null
          organization_id: string
          parking_spots: number
          status: Database["public"]["Enums"]["unit_status"]
          type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          area_m2?: number | null
          building_id: string
          code: string
          coefficient?: number
          created_at?: string
          created_by?: string | null
          floor?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          parking_spots?: number
          status?: Database["public"]["Enums"]["unit_status"]
          type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          area_m2?: number | null
          building_id?: string
          code?: string
          coefficient?: number
          created_at?: string
          created_by?: string | null
          floor?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          parking_spots?: number
          status?: Database["public"]["Enums"]["unit_status"]
          type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: {
          p_name: string
          p_slug?: string
          p_type?: Database["public"]["Enums"]["org_type"]
        }
        Returns: string
      }
      create_ticket: {
        Args: {
          p_unit_id: string
          p_category: Database["public"]["Enums"]["ticket_category"]
          p_subject: string
          p_body: string
        }
        Returns: string
      }
      end_lease: { Args: { p_unit_id: string }; Returns: undefined }
      generate_monthly_charges: {
        Args: { p_building_id: string; p_due_date?: string; p_period: string }
        Returns: number
      }
      has_org_role: {
        Args: { org: string; roles: Database["public"]["Enums"]["org_role"][] }
        Returns: boolean
      }
      is_building_resident: { Args: { building: string }; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      is_org_resident: { Args: { org: string }; Returns: boolean }
      is_unit_resident: { Args: { unit: string }; Returns: boolean }
      register_lease: {
        Args: {
          p_rent?: number
          p_start_date?: string
          p_tenant_person_id: string
          p_unit_id: string
        }
        Returns: undefined
      }
      transfer_ownership: {
        Args: { p_acquired_on?: string; p_person_id: string; p_unit_id: string }
        Returns: undefined
      }
    }
    Enums: {
      building_type: "residencial" | "comercial" | "mixto"
      charge_concept: "mantenimiento" | "extraordinaria" | "multa" | "otro"
      doc_type: "cedula" | "pasaporte" | "ruc" | "otro"
      expense_category:
        | "servicios"
        | "mantenimiento"
        | "personal"
        | "administrativo"
        | "seguros"
        | "reserva"
        | "otro"
      fee_method: "por_coeficiente" | "monto_fijo"
      org_role: "owner" | "administrador" | "asistente"
      org_type: "administradora" | "self_managed"
      payment_method:
        | "efectivo"
        | "transferencia"
        | "cheque"
        | "tarjeta"
        | "otro"
      ticket_category: "queja" | "solicitud" | "sugerencia"
      ticket_status: "abierta" | "en_proceso" | "resuelta" | "cerrada"
      unit_status: "ocupada" | "desocupada" | "en_venta" | "en_alquiler"
      unit_type: "apartamento" | "local" | "parqueo" | "deposito" | "otro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      building_type: ["residencial", "comercial", "mixto"],
      charge_concept: ["mantenimiento", "extraordinaria", "multa", "otro"],
      doc_type: ["cedula", "pasaporte", "ruc", "otro"],
      expense_category: [
        "servicios",
        "mantenimiento",
        "personal",
        "administrativo",
        "seguros",
        "reserva",
        "otro",
      ],
      fee_method: ["por_coeficiente", "monto_fijo"],
      org_role: ["owner", "administrador", "asistente"],
      org_type: ["administradora", "self_managed"],
      payment_method: [
        "efectivo",
        "transferencia",
        "cheque",
        "tarjeta",
        "otro",
      ],
      ticket_category: ["queja", "solicitud", "sugerencia"],
      ticket_status: ["abierta", "en_proceso", "resuelta", "cerrada"],
      unit_status: ["ocupada", "desocupada", "en_venta", "en_alquiler"],
      unit_type: ["apartamento", "local", "parqueo", "deposito", "otro"],
    },
  },
} as const
