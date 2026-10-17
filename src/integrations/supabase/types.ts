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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          entidade: string | null
          entidade_id: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string | null
          entidade_id?: string | null
          id?: never
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string | null
          entidade_id?: string | null
          id?: never
          user_id?: string | null
        }
        Relationships: []
      }
      disciplinas: {
        Row: {
          cor: string
          icone: string
          id: string
          nome: string
        }
        Insert: {
          cor?: string
          icone?: string
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          icone?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      edumind_mensagens: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts: Json
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      entregas: {
        Row: {
          aluno_id: string
          concluida_em: string | null
          id: string
          nota: number | null
          status: Database["public"]["Enums"]["status_entrega"]
          tarefa_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          concluida_em?: string | null
          id?: string
          nota?: number | null
          status?: Database["public"]["Enums"]["status_entrega"]
          tarefa_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          concluida_em?: string | null
          id?: string
          nota?: number | null
          status?: Database["public"]["Enums"]["status_entrega"]
          tarefa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          created_at: string
          dono_id: string | null
          id: string
          inicio: string
          oficial: boolean
          tipo: string
          titulo: string
          turma_id: string | null
        }
        Insert: {
          created_at?: string
          dono_id?: string | null
          id?: string
          inicio: string
          oficial?: boolean
          tipo?: string
          titulo: string
          turma_id?: string | null
        }
        Update: {
          created_at?: string
          dono_id?: string | null
          id?: string
          inicio?: string
          oficial?: boolean
          tipo?: string
          titulo?: string
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          aluno_id: string
          created_at: string
          id: string
          status: string
          turma_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          id?: string
          status?: string
          turma_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          id?: string
          status?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          aluno_id: string
          id: string
          lancada_em: string
          prova_id: string
          valor: number
        }
        Insert: {
          aluno_id: string
          id?: string
          lancada_em?: string
          prova_id: string
          valor: number
        }
        Update: {
          aluno_id?: string
          id?: string
          lancada_em?: string
          prova_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "notas_prova_id_fkey"
            columns: ["prova_id"]
            isOneToOne: false
            referencedRelation: "provas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          matricula: string | null
          nome: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          matricula?: string | null
          nome?: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      provas: {
        Row: {
          conteudo: string | null
          created_at: string
          data: string
          disciplina_id: string
          id: string
          peso: number
          titulo: string
          turma_id: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          data: string
          disciplina_id: string
          id?: string
          peso?: number
          titulo: string
          turma_id: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          data?: string
          disciplina_id?: string
          id?: string
          peso?: number
          titulo?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes: {
        Row: {
          alternativas: Json
          area: string
          autor_id: string | null
          categoria: Database["public"]["Enums"]["categoria_exame"]
          created_at: string
          enunciado: string
          id: string
        }
        Insert: {
          alternativas: Json
          area: string
          autor_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_exame"]
          created_at?: string
          enunciado: string
          id?: string
        }
        Update: {
          alternativas?: Json
          area?: string
          autor_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_exame"]
          created_at?: string
          enunciado?: string
          id?: string
        }
        Relationships: []
      }
      questoes_gabarito: {
        Row: {
          correta: number
          explicacao: string
          questao_id: string
        }
        Insert: {
          correta: number
          explicacao?: string
          questao_id: string
        }
        Update: {
          correta?: number
          explicacao?: string
          questao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_gabarito_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: true
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      simulado_questoes: {
        Row: {
          ordem: number
          questao_id: string
          simulado_id: string
        }
        Insert: {
          ordem?: number
          questao_id: string
          simulado_id: string
        }
        Update: {
          ordem?: number
          questao_id?: string
          simulado_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulado_questoes_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulado_questoes_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados: {
        Row: {
          autor_id: string | null
          categoria: Database["public"]["Enums"]["categoria_exame"]
          created_at: string
          duracao_min: number
          id: string
          titulo: string
        }
        Insert: {
          autor_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_exame"]
          created_at?: string
          duracao_min?: number
          id?: string
          titulo: string
        }
        Update: {
          autor_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_exame"]
          created_at?: string
          duracao_min?: number
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_exame"] | null
          created_at: string
          descricao: string | null
          disciplina_id: string
          id: string
          permite_anexo: boolean
          prazo: string
          prioridade: Database["public"]["Enums"]["prioridade"]
          professor_id: string | null
          titulo: string
          turma_id: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_exame"] | null
          created_at?: string
          descricao?: string | null
          disciplina_id: string
          id?: string
          permite_anexo?: boolean
          prazo: string
          prioridade?: Database["public"]["Enums"]["prioridade"]
          professor_id?: string | null
          titulo: string
          turma_id: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_exame"] | null
          created_at?: string
          descricao?: string | null
          disciplina_id?: string
          id?: string
          permite_anexo?: boolean
          prazo?: string
          prioridade?: Database["public"]["Enums"]["prioridade"]
          professor_id?: string | null
          titulo?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      tentativas: {
        Row: {
          acertos: number
          aluno_id: string
          created_at: string
          id: string
          nota: number
          respostas: Json
          simulado_id: string
          total: number
        }
        Insert: {
          acertos: number
          aluno_id: string
          created_at?: string
          id?: string
          nota: number
          respostas: Json
          simulado_id: string
          total: number
        }
        Update: {
          acertos?: number
          aluno_id?: string
          created_at?: string
          id?: string
          nota?: number
          respostas?: Json
          simulado_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "tentativas_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      turma_disciplinas: {
        Row: {
          disciplina_id: string
          id: string
          professor_id: string | null
          professor_nome: string
          turma_id: string
        }
        Insert: {
          disciplina_id: string
          id?: string
          professor_id?: string | null
          professor_nome?: string
          turma_id: string
        }
        Update: {
          disciplina_id?: string
          id?: string
          professor_id?: string | null
          professor_nome?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_disciplinas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_disciplinas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ano_letivo: number
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ano_letivo?: number
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ano_letivo?: number
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aluno_na_turma: { Args: { _turma: string }; Returns: boolean }
      enviar_tentativa: {
        Args: { _respostas: Json; _simulado: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_gestao: { Args: { _user_id: string }; Returns: boolean }
      pode_gerir_questoes: { Args: { _u: string }; Returns: boolean }
      prof_da_turma: { Args: { _turma: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "aluno"
        | "professor"
        | "secretaria"
        | "coordenacao"
        | "vice_diretor"
        | "diretor"
        | "admin"
      categoria_exame: "enem" | "ssa" | "vestibular" | "concurso"
      prioridade: "baixa" | "media" | "alta"
      status_entrega: "em_andamento" | "concluida"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "aluno",
        "professor",
        "secretaria",
        "coordenacao",
        "vice_diretor",
        "diretor",
        "admin",
      ],
      categoria_exame: ["enem", "ssa", "vestibular", "concurso"],
      prioridade: ["baixa", "media", "alta"],
      status_entrega: ["em_andamento", "concluida"],
    },
  },
} as const
