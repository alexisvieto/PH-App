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
      ad_campaign_targets: {
        Row: {
          campaign_id: string
          organization_id: string
        }
        Insert: {
          campaign_id: string
          organization_id: string
        }
        Update: {
          campaign_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaign_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaign_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          advertiser_name: string
          clicks_count: number
          created_at: string
          created_by: string | null
          ends_on: string | null
          id: string
          image_path: string | null
          is_global: boolean
          link_url: string | null
          priority: number
          starts_on: string | null
          status: Database["public"]["Enums"]["ad_status"]
          title: string
        }
        Insert: {
          advertiser_name: string
          clicks_count?: number
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          id?: string
          image_path?: string | null
          is_global?: boolean
          link_url?: string | null
          priority?: number
          starts_on?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title: string
        }
        Update: {
          advertiser_name?: string
          clicks_count?: number
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          id?: string
          image_path?: string | null
          is_global?: boolean
          link_url?: string | null
          priority?: number
          starts_on?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title?: string
        }
        Relationships: []
      }
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
          {
            foreignKeyName: "fk_reads_announcement_org"
            columns: ["announcement_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id", "organization_id"]
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
          kind: Database["public"]["Enums"]["announcement_kind"]
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
          kind?: Database["public"]["Enums"]["announcement_kind"]
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
          kind?: Database["public"]["Enums"]["announcement_kind"]
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
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      anomaly_photos: {
        Row: {
          anomaly_id: string
          created_at: string
          id: string
          organization_id: string
          sort_order: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          anomaly_id: string
          created_at?: string
          id?: string
          organization_id: string
          sort_order?: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          anomaly_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          sort_order?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_anomaly_photo_report"
            columns: ["anomaly_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "anomaly_reports"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      anomaly_reports: {
        Row: {
          building_id: string
          created_at: string
          created_by: string | null
          description: string
          equipment_id: string | null
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["anomaly_status"]
          supplier_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          building_id: string
          created_at?: string
          created_by?: string | null
          description: string
          equipment_id?: string | null
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["anomaly_status"]
          supplier_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          building_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          equipment_id?: string | null
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["anomaly_status"]
          supplier_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_reports_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomaly_reports_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomaly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_anomaly_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_anomaly_equipment_org"
            columns: ["equipment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_anomaly_supplier_org"
            columns: ["supplier_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      area_reservations: {
        Row: {
          area_id: string
          building_id: string
          created_at: string
          end_time: string
          guests: number | null
          id: string
          notes: string | null
          organization_id: string
          reservation_date: string
          reserved_by: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rules_accepted_at: string | null
          rules_snapshot: string | null
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string | null
        }
        Insert: {
          area_id: string
          building_id: string
          created_at?: string
          end_time: string
          guests?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          reservation_date: string
          reserved_by?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rules_accepted_at?: string | null
          rules_snapshot?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["reservation_status"]
          unit_id?: string | null
        }
        Update: {
          area_id?: string
          building_id?: string
          created_at?: string
          end_time?: string
          guests?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          reservation_date?: string
          reserved_by?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rules_accepted_at?: string | null
          rules_snapshot?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_resv_area_org"
            columns: ["area_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "common_areas"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_resv_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_resv_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_resv_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
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
          {
            foreignKeyName: "fk_charges_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_charges_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      common_areas: {
        Row: {
          active: boolean
          advance_days: number
          building_id: string
          capacity: number | null
          close_time: string
          created_at: string
          description: string | null
          icon: string
          id: string
          max_minutes: number | null
          name: string
          open_time: string
          organization_id: string
          requires_approval: boolean
          rules: string | null
        }
        Insert: {
          active?: boolean
          advance_days?: number
          building_id: string
          capacity?: number | null
          close_time?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          max_minutes?: number | null
          name: string
          open_time?: string
          organization_id: string
          requires_approval?: boolean
          rules?: string | null
        }
        Update: {
          active?: boolean
          advance_days?: number
          building_id?: string
          capacity?: number | null
          close_time?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          max_minutes?: number | null
          name?: string
          open_time?: string
          organization_id?: string
          requires_approval?: boolean
          rules?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_area_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_area_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_rates: {
        Row: {
          applies: boolean
          base: string
          concept: string
          employee_pct: number
          employer_pct: number
          note: string | null
          rule_set_id: string
        }
        Insert: {
          applies?: boolean
          base?: string
          concept: string
          employee_pct?: number
          employer_pct?: number
          note?: string | null
          rule_set_id: string
        }
        Update: {
          applies?: boolean
          base?: string
          concept?: string
          employee_pct?: number
          employer_pct?: number
          note?: string | null
          rule_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_rates_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "legal_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          currency: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          currency: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          currency?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      employee_warnings: {
        Row: {
          created_at: string
          created_by: string | null
          document_path: string | null
          employee_id: string
          id: string
          organization_id: string
          reason: string
          type: string
          warning_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_path?: string | null
          employee_id: string
          id?: string
          organization_id: string
          reason: string
          type?: string
          warning_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_path?: string | null
          employee_id?: string
          id?: string
          organization_id?: string
          reason?: string
          type?: string
          warning_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_warning_employee_org"
            columns: ["employee_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          base_salary: number
          birth_date: string | null
          building_id: string | null
          contract_end_date: string | null
          contract_path: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          country_code: string
          created_at: string
          created_by: string | null
          declares_dependents: boolean
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string
          hire_date: string
          id: string
          national_id: string | null
          organization_id: string
          pay_frequency: Database["public"]["Enums"]["pay_frequency"]
          phone: string | null
          photo_path: string | null
          position: string | null
          risk_premium_pct: number
          sex: string | null
          social_security_no: string | null
          status: Database["public"]["Enums"]["employee_status"]
          termination_date: string | null
          termination_reason: string | null
          updated_at: string
          work_shift: Database["public"]["Enums"]["work_shift"]
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          base_salary: number
          birth_date?: string | null
          building_id?: string | null
          contract_end_date?: string | null
          contract_path?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          country_code?: string
          created_at?: string
          created_by?: string | null
          declares_dependents?: boolean
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name: string
          hire_date: string
          id?: string
          national_id?: string | null
          organization_id: string
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"]
          phone?: string | null
          photo_path?: string | null
          position?: string | null
          risk_premium_pct?: number
          sex?: string | null
          social_security_no?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
          work_shift?: Database["public"]["Enums"]["work_shift"]
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number
          birth_date?: string | null
          building_id?: string | null
          contract_end_date?: string | null
          contract_path?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          country_code?: string
          created_at?: string
          created_by?: string | null
          declares_dependents?: boolean
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string
          hire_date?: string
          id?: string
          national_id?: string | null
          organization_id?: string
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"]
          phone?: string | null
          photo_path?: string | null
          position?: string | null
          risk_premium_pct?: number
          sex?: string | null
          social_security_no?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
          work_shift?: Database["public"]["Enums"]["work_shift"]
        }
        Relationships: [
          {
            foreignKeyName: "employees_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      equipment: {
        Row: {
          building_id: string
          category: Database["public"]["Enums"]["equipment_category"]
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          maintenance_frequency_days: number | null
          name: string
          next_maintenance: string | null
          notes: string | null
          organization_id: string
          quantity: number
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          building_id: string
          category?: Database["public"]["Enums"]["equipment_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          maintenance_frequency_days?: number | null
          name: string
          next_maintenance?: string | null
          notes?: string | null
          organization_id: string
          quantity?: number
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          building_id?: string
          category?: Database["public"]["Enums"]["equipment_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          maintenance_frequency_days?: number | null
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          organization_id?: string
          quantity?: number
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_equipment_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_equipment_supplier_org"
            columns: ["supplier_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id", "organization_id"]
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
          project_id: string | null
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
          project_id?: string | null
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
          project_id?: string | null
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
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expenses_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
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
          late_fee_day: number | null
          late_fee_pct: number
          method: Database["public"]["Enums"]["fee_method"]
          organization_id: string
          reserve_pct: number
          updated_at: string
        }
        Insert: {
          base_amount?: number
          building_id: string
          created_by?: string | null
          currency?: string
          id?: string
          late_fee_day?: number | null
          late_fee_pct?: number
          method?: Database["public"]["Enums"]["fee_method"]
          organization_id: string
          reserve_pct?: number
          updated_at?: string
        }
        Update: {
          base_amount?: number
          building_id?: string
          created_by?: string | null
          currency?: string
          id?: string
          late_fee_day?: number | null
          late_fee_pct?: number
          method?: Database["public"]["Enums"]["fee_method"]
          organization_id?: string
          reserve_pct?: number
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
          {
            foreignKeyName: "fk_fee_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      infractions: {
        Row: {
          amount: number | null
          building_id: string
          charge_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          infraction_date: string
          organization_id: string
          reason: string
          type: Database["public"]["Enums"]["infraction_type"]
          unit_id: string
        }
        Insert: {
          amount?: number | null
          building_id: string
          charge_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          infraction_date?: string
          organization_id: string
          reason: string
          type: Database["public"]["Enums"]["infraction_type"]
          unit_id: string
        }
        Update: {
          amount?: number | null
          building_id?: string
          charge_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          infraction_date?: string
          organization_id?: string
          reason?: string
          type?: Database["public"]["Enums"]["infraction_type"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_infraction_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_infraction_charge_org"
            columns: ["charge_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_infraction_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_infraction_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      intercom_requests: {
        Row: {
          building_id: string
          created_at: string
          guard_id: string | null
          id: string
          organization_id: string
          photo_path: string | null
          responded_at: string | null
          responded_by: string | null
          response_note: string | null
          status: Database["public"]["Enums"]["intercom_status"]
          unit_id: string
          visitor_name: string
        }
        Insert: {
          building_id: string
          created_at?: string
          guard_id?: string | null
          id?: string
          organization_id: string
          photo_path?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["intercom_status"]
          unit_id: string
          visitor_name: string
        }
        Update: {
          building_id?: string
          created_at?: string
          guard_id?: string | null
          id?: string
          organization_id?: string
          photo_path?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["intercom_status"]
          unit_id?: string
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_ic_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          id: string
          organization_id: string
          source_id: string | null
          source_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          entry_date: string
          id?: string
          organization_id: string
          source_id?: string | null
          source_type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          organization_id?: string
          source_id?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          entry_id: string
          id: string
          organization_id: string
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
          organization_id: string
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_fk"
            columns: ["account_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "journal_lines_entry_fk"
            columns: ["entry_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          fund: Database["public"]["Enums"]["account_fund"]
          id: string
          is_system: boolean
          name: string
          organization_id: string
          system_role: string | null
          tax_exempt: boolean
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          fund?: Database["public"]["Enums"]["account_fund"]
          id?: string
          is_system?: boolean
          name: string
          organization_id: string
          system_role?: string | null
          tax_exempt?: boolean
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          fund?: Database["public"]["Enums"]["account_fund"]
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string
          system_role?: string | null
          tax_exempt?: boolean
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_constants: {
        Row: {
          applies: boolean
          key: string
          note: string | null
          num_value: number | null
          rule_set_id: string
        }
        Insert: {
          applies?: boolean
          key: string
          note?: string | null
          num_value?: number | null
          rule_set_id: string
        }
        Update: {
          applies?: boolean
          key?: string
          note?: string | null
          num_value?: number | null
          rule_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_constants_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "legal_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_rule_sets: {
        Row: {
          country_code: string
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          note: string | null
          version: number
        }
        Insert: {
          country_code: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          note?: string | null
          version: number
        }
        Update: {
          country_code?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          note?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "legal_rule_sets_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      liquidations: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          created_by: string | null
          cumplio_preaviso: boolean | null
          detail: Json | null
          employee_id: string
          empresa_dio_preaviso: boolean | null
          id: string
          incentivo_pactado: number
          indemnizacion: number
          organization_id: string
          penalidad: number
          preaviso: number
          prima_antiguedad: number
          reference_salary: number
          rule_set_id: string | null
          scenario: Database["public"]["Enums"]["termination_scenario"]
          termination_date: string
          total: number
          vacaciones: number
          xiii_proporcional: number
          years_service: number
        }
        Insert: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          cumplio_preaviso?: boolean | null
          detail?: Json | null
          employee_id: string
          empresa_dio_preaviso?: boolean | null
          id?: string
          incentivo_pactado?: number
          indemnizacion?: number
          organization_id: string
          penalidad?: number
          preaviso?: number
          prima_antiguedad?: number
          reference_salary?: number
          rule_set_id?: string | null
          scenario: Database["public"]["Enums"]["termination_scenario"]
          termination_date: string
          total?: number
          vacaciones?: number
          xiii_proporcional?: number
          years_service?: number
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          cumplio_preaviso?: boolean | null
          detail?: Json | null
          employee_id?: string
          empresa_dio_preaviso?: boolean | null
          id?: string
          incentivo_pactado?: number
          indemnizacion?: number
          organization_id?: string
          penalidad?: number
          preaviso?: number
          prima_antiguedad?: number
          reference_salary?: number
          rule_set_id?: string | null
          scenario?: Database["public"]["Enums"]["termination_scenario"]
          termination_date?: string
          total?: number
          vacaciones?: number
          xiii_proporcional?: number
          years_service?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_liq_employee_org"
            columns: ["employee_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "liquidations_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "legal_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          building_id: string
          cost: number | null
          created_at: string
          created_by: string | null
          description: string
          equipment_id: string
          id: string
          organization_id: string
          performed_on: string
          supplier_id: string | null
        }
        Insert: {
          building_id: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          equipment_id: string
          id?: string
          organization_id: string
          performed_on?: string
          supplier_id?: string | null
        }
        Update: {
          building_id?: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          equipment_id?: string
          id?: string
          organization_id?: string
          performed_on?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_maintlog_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_maintlog_equipment_org"
            columns: ["equipment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_maintlog_supplier_org"
            columns: ["supplier_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "maintenance_logs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          organization_id: string
          read_at: string | null
          source_id: string | null
          source_type: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id: string
          read_at?: string | null
          source_id?: string | null
          source_type?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string
          read_at?: string | null
          source_id?: string | null
          source_type?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_payment_settings: {
        Row: {
          enabled: boolean
          merchant_id: string | null
          organization_id: string
          provider: string
          sandbox: boolean
          secret_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          merchant_id?: string | null
          organization_id: string
          provider?: string
          sandbox?: boolean
          secret_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          merchant_id?: string | null
          organization_id?: string
          provider?: string
          sandbox?: boolean
          secret_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_payment_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
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
      organization_modules: {
        Row: {
          activated_at: string
          enabled: boolean
          module_key: string
          organization_id: string
        }
        Insert: {
          activated_at?: string
          enabled?: boolean
          module_key: string
          organization_id: string
        }
        Update: {
          activated_at?: string
          enabled?: boolean
          module_key?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_modules_organization_id_fkey"
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
      packages: {
        Row: {
          building_id: string
          courier: string | null
          created_at: string
          delivered_at: string | null
          delivered_by: string | null
          delivered_to: string | null
          id: string
          notes: string | null
          organization_id: string
          photo_path: string | null
          received_at: string
          received_by: string | null
          status: Database["public"]["Enums"]["package_status"]
          unit_id: string
        }
        Insert: {
          building_id: string
          courier?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivered_to?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          photo_path?: string | null
          received_at?: string
          received_by?: string | null
          status?: Database["public"]["Enums"]["package_status"]
          unit_id: string
        }
        Update: {
          building_id?: string
          courier?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivered_to?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          photo_path?: string | null
          received_at?: string
          received_by?: string | null
          status?: Database["public"]["Enums"]["package_status"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pkg_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_pkg_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pkg_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      panic_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          building_id: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["panic_kind"] | null
          note: string | null
          organization_id: string
          resolved_at: string | null
          resolved_by: string | null
          source: Database["public"]["Enums"]["panic_source"]
          status: Database["public"]["Enums"]["panic_status"]
          triggered_by: string | null
          unit_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          building_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["panic_kind"] | null
          note?: string | null
          organization_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          source: Database["public"]["Enums"]["panic_source"]
          status?: Database["public"]["Enums"]["panic_status"]
          triggered_by?: string | null
          unit_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          building_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["panic_kind"] | null
          note?: string | null
          organization_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source?: Database["public"]["Enums"]["panic_source"]
          status?: Database["public"]["Enums"]["panic_status"]
          triggered_by?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_panic_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_panic_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_panic_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          building_id: string
          confirmation_number: string | null
          created_at: string
          created_by: string | null
          id: string
          order_ref: string
          organization_id: string
          payment_id: string | null
          status: Database["public"]["Enums"]["payment_order_status"]
          unit_id: string
        }
        Insert: {
          amount: number
          building_id: string
          confirmation_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          order_ref: string
          organization_id: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_order_status"]
          unit_id: string
        }
        Update: {
          amount?: number
          building_id?: string
          confirmation_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          order_ref?: string
          organization_id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_order_status"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_po_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_po_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_po_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "payment_orders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_payments_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_payments_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
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
      payroll_incidences: {
        Row: {
          amount: number | null
          created_at: string
          employee_id: string
          hours: number | null
          id: string
          note: string | null
          organization_id: string
          payroll_period_id: string
          type: Database["public"]["Enums"]["incidence_type"]
        }
        Insert: {
          amount?: number | null
          created_at?: string
          employee_id: string
          hours?: number | null
          id?: string
          note?: string | null
          organization_id: string
          payroll_period_id: string
          type: Database["public"]["Enums"]["incidence_type"]
        }
        Update: {
          amount?: number | null
          created_at?: string
          employee_id?: string
          hours?: number | null
          id?: string
          note?: string | null
          organization_id?: string
          payroll_period_id?: string
          type?: Database["public"]["Enums"]["incidence_type"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_payinc_employee_org"
            columns: ["employee_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_payinc_period_org"
            columns: ["payroll_period_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          base_amount: number
          commissions_amount: number
          created_at: string
          css_employee: number
          css_employer: number
          detail: Json | null
          employee_id: string
          gross: number
          id: string
          isr: number
          net: number
          organization_id: string
          other_deductions: number
          overtime_amount: number
          payroll_period_id: string
          riesgos_employer: number
          seguro_educativo_employee: number
          seguro_educativo_employer: number
        }
        Insert: {
          base_amount?: number
          commissions_amount?: number
          created_at?: string
          css_employee?: number
          css_employer?: number
          detail?: Json | null
          employee_id: string
          gross?: number
          id?: string
          isr?: number
          net?: number
          organization_id: string
          other_deductions?: number
          overtime_amount?: number
          payroll_period_id: string
          riesgos_employer?: number
          seguro_educativo_employee?: number
          seguro_educativo_employer?: number
        }
        Update: {
          base_amount?: number
          commissions_amount?: number
          created_at?: string
          css_employee?: number
          css_employer?: number
          detail?: Json | null
          employee_id?: string
          gross?: number
          id?: string
          isr?: number
          net?: number
          organization_id?: string
          other_deductions?: number
          overtime_amount?: number
          payroll_period_id?: string
          riesgos_employer?: number
          seguro_educativo_employee?: number
          seguro_educativo_employer?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_payitem_employee_org"
            columns: ["employee_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_payitem_period_org"
            columns: ["payroll_period_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          building_id: string | null
          created_at: string
          created_by: string | null
          frequency: Database["public"]["Enums"]["pay_frequency"]
          id: string
          kind: Database["public"]["Enums"]["payroll_kind"]
          label: string
          organization_id: string
          pay_date: string | null
          period_end: string
          period_start: string
          rule_set_id: string | null
          status: Database["public"]["Enums"]["payroll_status"]
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          frequency: Database["public"]["Enums"]["pay_frequency"]
          id?: string
          kind?: Database["public"]["Enums"]["payroll_kind"]
          label: string
          organization_id: string
          pay_date?: string | null
          period_end: string
          period_start: string
          rule_set_id?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
        }
        Update: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["pay_frequency"]
          id?: string
          kind?: Database["public"]["Enums"]["payroll_kind"]
          label?: string
          organization_id?: string
          pay_date?: string | null
          period_end?: string
          period_start?: string
          rule_set_id?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_payperiod_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "payroll_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "legal_rule_sets"
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
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
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
      project_quotes: {
        Row: {
          amount: number
          company_name: string
          created_at: string
          created_by: string | null
          file_path: string | null
          id: string
          is_winner: boolean
          notes: string | null
          organization_id: string
          project_id: string
        }
        Insert: {
          amount: number
          company_name: string
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          is_winner?: boolean
          notes?: string | null
          organization_id: string
          project_id: string
        }
        Update: {
          amount?: number
          company_name?: string
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          is_winner?: boolean
          notes?: string | null
          organization_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_quotes_project_fk"
            columns: ["project_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      projects: {
        Row: {
          award_reason: string | null
          awarded_at: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
        }
        Insert: {
          award_reason?: string | null
          awarded_at?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["project_status"]
          title: string
        }
        Update: {
          award_reason?: string | null
          awarded_at?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_building_fk"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          link_url: string | null
          logo_path: string | null
          name: string
          phone: string | null
          priority: number
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          link_url?: string | null
          logo_path?: string | null
          name: string
          phone?: string | null
          priority?: number
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          link_url?: string | null
          logo_path?: string | null
          name?: string
          phone?: string | null
          priority?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      salary_history: {
        Row: {
          base_salary: number
          created_at: string
          effective_from: string
          employee_id: string
          id: string
          note: string | null
          organization_id: string
        }
        Insert: {
          base_salary: number
          created_at?: string
          effective_from: string
          employee_id: string
          id?: string
          note?: string | null
          organization_id: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          effective_from?: string
          employee_id?: string
          id?: string
          note?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_salhist_employee_org"
            columns: ["employee_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      service_categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      service_provider_categories: {
        Row: {
          category_id: string
          provider_id: string
        }
        Insert: {
          category_id: string
          provider_id: string
        }
        Update: {
          category_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_categories_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          photo_path: string | null
          provider_id: string
          rating: number
          reviewer_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          photo_path?: string | null
          provider_id: string
          rating: number
          reviewer_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          photo_path?: string | null
          provider_id?: string
          rating?: number
          reviewer_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          active: boolean
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_path: string | null
          name: string
          phone: string | null
          priority: number
          rating_avg: number
          rating_count: number
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_path?: string | null
          name: string
          phone?: string | null
          priority?: number
          rating_avg?: number
          rating_count?: number
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          phone?: string | null
          priority?: number
          rating_avg?: number
          rating_count?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_brackets: {
        Row: {
          base_fixed: number
          id: string
          lower_bound: number
          ord: number
          rate: number
          rule_set_id: string
          tax: string
          upper_bound: number | null
        }
        Insert: {
          base_fixed?: number
          id?: string
          lower_bound: number
          ord: number
          rate?: number
          rule_set_id: string
          tax?: string
          upper_bound?: number | null
        }
        Update: {
          base_fixed?: number
          id?: string
          lower_bound?: number
          ord?: number
          rate?: number
          rule_set_id?: string
          tax?: string
          upper_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_brackets_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "legal_rule_sets"
            referencedColumns: ["id"]
          },
        ]
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
          author_id?: string
          body: string
          created_at?: string
          id?: string
          organization_id: string
          ticket_id: string
        }
        Update: {
          author_id?: string
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
            foreignKeyName: "fk_tickets_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_tickets_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "tickets_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
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
      unit_amenities: {
        Row: {
          created_at: string
          id: string
          identifier: string | null
          location: string | null
          organization_id: string
          type: Database["public"]["Enums"]["amenity_type"]
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier?: string | null
          location?: string | null
          organization_id: string
          type: Database["public"]["Enums"]["amenity_type"]
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string | null
          location?: string | null
          organization_id?: string
          type?: Database["public"]["Enums"]["amenity_type"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_amenity_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
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
          is_primary: boolean
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
          is_primary?: boolean
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
          is_primary?: boolean
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
          is_rented: boolean
          letter: string | null
          notes: string | null
          organization_id: string
          parking_spots: number
          status: Database["public"]["Enums"]["unit_status"]
          tenant_name: string | null
          tenant_phone: string | null
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
          is_rented?: boolean
          letter?: string | null
          notes?: string | null
          organization_id: string
          parking_spots?: number
          status?: Database["public"]["Enums"]["unit_status"]
          tenant_name?: string | null
          tenant_phone?: string | null
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
          is_rented?: boolean
          letter?: string | null
          notes?: string | null
          organization_id?: string
          parking_spots?: number
          status?: Database["public"]["Enums"]["unit_status"]
          tenant_name?: string | null
          tenant_phone?: string | null
          type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_units_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
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
      visitor_log: {
        Row: {
          authorized_by_user: string | null
          building_id: string
          direction: Database["public"]["Enums"]["log_direction"]
          guard_user: string | null
          id: string
          notes: string | null
          occurred_at: string
          organization_id: string
          pass_id: string | null
          photo_path: string | null
          unit_id: string | null
          vehicle_plate: string | null
          visitor_doc: string | null
          visitor_name: string
        }
        Insert: {
          authorized_by_user?: string | null
          building_id: string
          direction: Database["public"]["Enums"]["log_direction"]
          guard_user?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          organization_id: string
          pass_id?: string | null
          photo_path?: string | null
          unit_id?: string | null
          vehicle_plate?: string | null
          visitor_doc?: string | null
          visitor_name: string
        }
        Update: {
          authorized_by_user?: string | null
          building_id?: string
          direction?: Database["public"]["Enums"]["log_direction"]
          guard_user?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          organization_id?: string
          pass_id?: string | null
          photo_path?: string | null
          unit_id?: string | null
          vehicle_plate?: string | null
          visitor_doc?: string | null
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_log_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_log_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_log_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "visitor_log_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "visitor_passes"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_passes: {
        Row: {
          building_id: string
          code: string
          created_at: string
          created_by: string | null
          id: string
          max_uses: number | null
          notes: string | null
          organization_id: string
          recurring_days: number[] | null
          status: Database["public"]["Enums"]["pass_status"]
          time_from: string | null
          time_to: string | null
          type: Database["public"]["Enums"]["visitor_pass_type"]
          unit_id: string
          uses_count: number
          valid_from: string
          valid_to: string | null
          vehicle_plate: string | null
          visitor_doc: string | null
          visitor_name: string
        }
        Insert: {
          building_id: string
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          max_uses?: number | null
          notes?: string | null
          organization_id: string
          recurring_days?: number[] | null
          status?: Database["public"]["Enums"]["pass_status"]
          time_from?: string | null
          time_to?: string | null
          type?: Database["public"]["Enums"]["visitor_pass_type"]
          unit_id: string
          uses_count?: number
          valid_from?: string
          valid_to?: string | null
          vehicle_plate?: string | null
          visitor_doc?: string | null
          visitor_name: string
        }
        Update: {
          building_id?: string
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          max_uses?: number | null
          notes?: string | null
          organization_id?: string
          recurring_days?: number[] | null
          status?: Database["public"]["Enums"]["pass_status"]
          time_from?: string | null
          time_to?: string | null
          type?: Database["public"]["Enums"]["visitor_pass_type"]
          unit_id?: string
          uses_count?: number
          valid_from?: string
          valid_to?: string | null
          vehicle_plate?: string | null
          visitor_doc?: string | null
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pass_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_pass_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pass_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      votation_options: {
        Row: {
          id: string
          label: string
          organization_id: string
          sort_order: number
          votation_id: string
        }
        Insert: {
          id?: string
          label: string
          organization_id: string
          sort_order?: number
          votation_id: string
        }
        Update: {
          id?: string
          label?: string
          organization_id?: string
          sort_order?: number
          votation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_vo_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vo_votation_org"
            columns: ["votation_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "votations"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      votation_votes: {
        Row: {
          id: string
          is_abstention: boolean
          option_id: string | null
          organization_id: string
          unit_id: string
          votation_id: string
          voted_at: string
          voter_id: string | null
          weight: number
        }
        Insert: {
          id?: string
          is_abstention?: boolean
          option_id?: string | null
          organization_id: string
          unit_id: string
          votation_id: string
          voted_at?: string
          voter_id?: string | null
          weight: number
        }
        Update: {
          id?: string
          is_abstention?: boolean
          option_id?: string | null
          organization_id?: string
          unit_id?: string
          votation_id?: string
          voted_at?: string
          voter_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_vv_option_org"
            columns: ["option_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "votation_options"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_vv_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vv_unit_org"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_vv_votation_org"
            columns: ["votation_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "votations"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      votations: {
        Row: {
          approval_pct: number
          building_id: string
          closes_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["votation_kind"]
          opens_at: string | null
          organization_id: string
          quorum_pct: number
          result_snapshot: Json | null
          secret: boolean
          status: Database["public"]["Enums"]["votation_status"]
          title: string
        }
        Insert: {
          approval_pct?: number
          building_id: string
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["votation_kind"]
          opens_at?: string | null
          organization_id: string
          quorum_pct?: number
          result_snapshot?: Json | null
          secret?: boolean
          status?: Database["public"]["Enums"]["votation_status"]
          title: string
        }
        Update: {
          approval_pct?: number
          building_id?: string
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["votation_kind"]
          opens_at?: string | null
          organization_id?: string
          quorum_pct?: number
          result_snapshot?: Json | null
          secret?: boolean
          status?: Database["public"]["Enums"]["votation_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_vot_building_org"
            columns: ["building_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_vot_org"
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
      accounting_summary: {
        Args: { p_from: string; p_org: string; p_to: string }
        Returns: Json
      }
      add_unit_owner: {
        Args: {
          p_acquired_on?: string
          p_doc_number: string
          p_doc_type: string
          p_email: string
          p_full_name: string
          p_is_primary: boolean
          p_phone: string
          p_unit_id: string
        }
        Returns: string
      }
      award_project_quote: {
        Args: { p_project: string; p_quote: string; p_reason: string }
        Returns: undefined
      }
      cast_vote: {
        Args: {
          p_abstention: boolean
          p_option: string
          p_unit: string
          p_votation: string
        }
        Returns: undefined
      }
      change_employee_salary: {
        Args: {
          p_employee_id: string
          p_from: string
          p_note?: string
          p_salary: number
        }
        Returns: undefined
      }
      confirm_yappy_payment: {
        Args: {
          p_confirmation: string
          p_hash: string
          p_order_ref: string
          p_status: string
        }
        Returns: string
      }
      create_infraction: {
        Args: {
          p_amount?: number
          p_description?: string
          p_due_date?: string
          p_infraction_date?: string
          p_reason: string
          p_type: Database["public"]["Enums"]["infraction_type"]
          p_unit_id: string
        }
        Returns: string
      }
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
          p_body: string
          p_category: Database["public"]["Enums"]["ticket_category"]
          p_subject: string
          p_unit_id: string
        }
        Returns: string
      }
      end_lease: { Args: { p_unit_id: string }; Returns: undefined }
      freeze_votation_result: {
        Args: { p_votation: string }
        Returns: undefined
      }
      generate_all_monthly_charges: { Args: never; Returns: number }
      generate_late_fees: { Args: never; Returns: number }
      generate_monthly_charges: {
        Args: { p_building_id: string; p_due_date?: string; p_period: string }
        Returns: number
      }
      get_area_availability: {
        Args: { p_area_id: string; p_from: string; p_to: string }
        Returns: {
          end_time: string
          reservation_date: string
          start_time: string
        }[]
      }
      get_finance_summary: {
        Args: { p_from: string; p_org: string; p_to: string }
        Returns: Json
      }
      get_votation_results: { Args: { p_votation: string }; Returns: Json }
      has_module: { Args: { org: string; p_module: string }; Returns: boolean }
      has_org_role: {
        Args: { org: string; roles: Database["public"]["Enums"]["org_role"][] }
        Returns: boolean
      }
      is_building_resident: { Args: { building: string }; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      is_org_resident: { Args: { org: string }; Returns: boolean }
      is_org_staff: { Args: { org: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_unit_resident: { Args: { unit: string }; Returns: boolean }
      link_people_to_user: {
        Args: { p_email: string; p_user: string }
        Returns: undefined
      }
      notif_is_staff: {
        Args: { p_org: string; p_uid: string }
        Returns: boolean
      }
      platform_create_org: {
        Args: {
          p_name: string
          p_type?: Database["public"]["Enums"]["org_type"]
        }
        Returns: string
      }
      platform_create_org_admin: {
        Args: {
          p_email: string
          p_full_name: string
          p_org_id: string
          p_password: string
          p_role?: Database["public"]["Enums"]["org_role"]
        }
        Returns: string
      }
      platform_onboard_subscriber: {
        Args: {
          p_admin_email: string
          p_admin_name: string
          p_admin_password: string
          p_org_name: string
          p_org_type: Database["public"]["Enums"]["org_type"]
        }
        Returns: Json
      }
      platform_set_org_module: {
        Args: { p_enabled: boolean; p_module: string; p_org: string }
        Returns: undefined
      }
      post_charge: {
        Args: { c: Database["public"]["Tables"]["charges"]["Row"] }
        Returns: undefined
      }
      post_expense: {
        Args: { e: Database["public"]["Tables"]["expenses"]["Row"] }
        Returns: undefined
      }
      post_payment: {
        Args: { p: Database["public"]["Tables"]["payments"]["Row"] }
        Returns: undefined
      }
      post_payroll_period: { Args: { p_period: string }; Returns: undefined }
      purge_old_access_records: { Args: never; Returns: undefined }
      recompute_provider_rating: {
        Args: { p_provider: string }
        Returns: undefined
      }
      register_ad_click: { Args: { p_campaign: string }; Returns: undefined }
      register_lease: {
        Args: {
          p_rent?: number
          p_start_date?: string
          p_tenant_person_id: string
          p_unit_id: string
        }
        Returns: undefined
      }
      register_visit: {
        Args: {
          p_building: string
          p_direction: Database["public"]["Enums"]["log_direction"]
          p_org: string
          p_pass_id: string
          p_photo_path: string
          p_unit: string
          p_vehicle_plate: string
          p_visitor_doc: string
          p_visitor_name: string
        }
        Returns: undefined
      }
      seed_ledger_accounts: { Args: { p_org: string }; Returns: undefined }
      set_yappy_config: {
        Args: {
          p_enabled: boolean
          p_merchant_id: string
          p_org: string
          p_sandbox: boolean
          p_secret: string
        }
        Returns: undefined
      }
      sync_votation_status: { Args: never; Returns: undefined }
      transfer_ownership: {
        Args: { p_acquired_on?: string; p_person_id: string; p_unit_id: string }
        Returns: undefined
      }
      unit_overdue_maint_count: { Args: { p_unit: string }; Returns: number }
      votable_units_for: {
        Args: { p_votation: string }
        Returns: {
          is_current: boolean
          unit_code: string
          unit_id: string
        }[]
      }
      votation_eligible_units: { Args: { p_votation: string }; Returns: number }
    }
    Enums: {
      account_fund: "operativo" | "imprevistos"
      account_type: "activo" | "pasivo" | "patrimonio" | "ingreso" | "gasto"
      ad_status: "active" | "paused"
      amenity_type: "estacionamiento" | "deposito"
      announcement_kind: "anuncio" | "novedad"
      anomaly_status: "abierta" | "resuelta"
      building_type: "residencial" | "comercial" | "mixto"
      charge_concept:
        | "mantenimiento"
        | "extraordinaria"
        | "multa"
        | "otro"
        | "recargo"
      contract_type: "indefinido" | "definido"
      doc_type: "cedula" | "pasaporte" | "ruc" | "otro"
      employee_status: "activo" | "inactivo"
      equipment_category:
        | "elevador"
        | "piscina"
        | "gimnasio"
        | "planta_electrica"
        | "bomba"
        | "tanque_reserva"
        | "alarma_incendio"
        | "aire_acondicionado"
        | "computadora"
        | "jardin"
        | "herramienta"
        | "otro"
      equipment_status: "operativo" | "en_reparacion" | "fuera_servicio"
      expense_category:
        | "servicios"
        | "mantenimiento"
        | "personal"
        | "administrativo"
        | "seguros"
        | "reserva"
        | "otro"
      fee_method: "por_coeficiente" | "monto_fijo"
      incidence_type:
        | "hora_extra_diurna"
        | "hora_extra_nocturna"
        | "hora_extra_mixta"
        | "dia_fiesta"
        | "hora_extra_fiesta_domingo"
        | "comision"
        | "bono"
        | "otro_ingreso"
        | "deduccion"
      infraction_type: "llamado_atencion" | "multa"
      intercom_status: "pendiente" | "autorizada" | "rechazada" | "cancelada"
      log_direction: "entrada" | "salida"
      org_role: "owner" | "administrador" | "asistente" | "guardia"
      org_type: "administradora" | "self_managed"
      package_status: "en_garita" | "entregado"
      panic_kind: "medica" | "seguridad" | "incendio" | "otro"
      panic_source: "residente" | "guardia"
      panic_status: "activa" | "atendida" | "resuelta" | "cancelada"
      pass_status: "activo" | "anulado"
      pay_frequency: "quincenal" | "mensual"
      payment_method:
        | "efectivo"
        | "transferencia"
        | "cheque"
        | "tarjeta"
        | "otro"
        | "yappy"
      payment_order_status:
        | "creada"
        | "ejecutada"
        | "rechazada"
        | "cancelada"
        | "expirada"
      payroll_kind: "ordinaria" | "xiii"
      payroll_status: "borrador" | "procesada" | "pagada"
      project_status: "abierto" | "adjudicado" | "cerrado"
      reservation_status: "pendiente" | "aprobada" | "rechazada" | "cancelada"
      termination_scenario:
        | "renuncia"
        | "mutuo_acuerdo"
        | "despido_injustificado"
      ticket_category: "queja" | "solicitud" | "sugerencia"
      ticket_status: "abierta" | "en_proceso" | "resuelta" | "cerrada"
      unit_status: "ocupada" | "desocupada" | "en_venta" | "en_alquiler"
      unit_type: "apartamento" | "local" | "parqueo" | "deposito" | "otro"
      visitor_pass_type:
        | "visita"
        | "evento"
        | "recurrente"
        | "domestico"
        | "proveedor"
        | "delivery"
        | "indefinido"
      votation_kind: "si_no" | "multiple"
      votation_status: "borrador" | "abierta" | "cerrada"
      work_shift: "diurna" | "mixta" | "nocturna"
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
      account_fund: ["operativo", "imprevistos"],
      account_type: ["activo", "pasivo", "patrimonio", "ingreso", "gasto"],
      ad_status: ["active", "paused"],
      amenity_type: ["estacionamiento", "deposito"],
      announcement_kind: ["anuncio", "novedad"],
      anomaly_status: ["abierta", "resuelta"],
      building_type: ["residencial", "comercial", "mixto"],
      charge_concept: [
        "mantenimiento",
        "extraordinaria",
        "multa",
        "otro",
        "recargo",
      ],
      contract_type: ["indefinido", "definido"],
      doc_type: ["cedula", "pasaporte", "ruc", "otro"],
      employee_status: ["activo", "inactivo"],
      equipment_category: [
        "elevador",
        "piscina",
        "gimnasio",
        "planta_electrica",
        "bomba",
        "tanque_reserva",
        "alarma_incendio",
        "aire_acondicionado",
        "computadora",
        "jardin",
        "herramienta",
        "otro",
      ],
      equipment_status: ["operativo", "en_reparacion", "fuera_servicio"],
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
      incidence_type: [
        "hora_extra_diurna",
        "hora_extra_nocturna",
        "hora_extra_mixta",
        "dia_fiesta",
        "hora_extra_fiesta_domingo",
        "comision",
        "bono",
        "otro_ingreso",
        "deduccion",
      ],
      infraction_type: ["llamado_atencion", "multa"],
      intercom_status: ["pendiente", "autorizada", "rechazada", "cancelada"],
      log_direction: ["entrada", "salida"],
      org_role: ["owner", "administrador", "asistente", "guardia"],
      org_type: ["administradora", "self_managed"],
      package_status: ["en_garita", "entregado"],
      panic_kind: ["medica", "seguridad", "incendio", "otro"],
      panic_source: ["residente", "guardia"],
      panic_status: ["activa", "atendida", "resuelta", "cancelada"],
      pass_status: ["activo", "anulado"],
      pay_frequency: ["quincenal", "mensual"],
      payment_method: [
        "efectivo",
        "transferencia",
        "cheque",
        "tarjeta",
        "otro",
        "yappy",
      ],
      payment_order_status: [
        "creada",
        "ejecutada",
        "rechazada",
        "cancelada",
        "expirada",
      ],
      payroll_kind: ["ordinaria", "xiii"],
      payroll_status: ["borrador", "procesada", "pagada"],
      project_status: ["abierto", "adjudicado", "cerrado"],
      reservation_status: ["pendiente", "aprobada", "rechazada", "cancelada"],
      termination_scenario: [
        "renuncia",
        "mutuo_acuerdo",
        "despido_injustificado",
      ],
      ticket_category: ["queja", "solicitud", "sugerencia"],
      ticket_status: ["abierta", "en_proceso", "resuelta", "cerrada"],
      unit_status: ["ocupada", "desocupada", "en_venta", "en_alquiler"],
      unit_type: ["apartamento", "local", "parqueo", "deposito", "otro"],
      visitor_pass_type: [
        "visita",
        "evento",
        "recurrente",
        "domestico",
        "proveedor",
        "delivery",
        "indefinido",
      ],
      votation_kind: ["si_no", "multiple"],
      votation_status: ["borrador", "abierta", "cerrada"],
      work_shift: ["diurna", "mixta", "nocturna"],
    },
  },
} as const
