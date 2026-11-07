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
      comunicados: {
        Row: {
          aprovado_por: string | null
          autor_id: string
          corpo: string
          created_at: string
          destino: string
          id: string
          motivo: string | null
          perfil_destino: string | null
          publicado_em: string | null
          status: string
          titulo: string
          turma_id: string | null
        }
        Insert: {
          aprovado_por?: string | null
          autor_id?: string
          corpo: string
          created_at?: string
          destino?: string
          id?: string
          motivo?: string | null
          perfil_destino?: string | null
          publicado_em?: string | null
          status?: string
          titulo: string
          turma_id?: string | null
        }
        Update: {
          aprovado_por?: string | null
          autor_id?: string
          corpo?: string
          created_at?: string
          destino?: string
          id?: string
          motivo?: string | null
          perfil_destino?: string | null
          publicado_em?: string | null
          status?: string
          titulo?: string
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudos: {
        Row: {
          created_at: string
          disciplina_id: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          created_at?: string
          disciplina_id: string
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          created_at?: string
          disciplina_id?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      desafio_conclusoes: {
        Row: {
          aluno_id: string
          created_at: string
          desafio_id: string
          id: string
          pontos: number
        }
        Insert: {
          aluno_id: string
          created_at?: string
          desafio_id: string
          id?: string
          pontos: number
        }
        Update: {
          aluno_id?: string
          created_at?: string
          desafio_id?: string
          id?: string
          pontos?: number
        }
        Relationships: [
          {
            foreignKeyName: "desafio_conclusoes_desafio_id_fkey"
            columns: ["desafio_id"]
            isOneToOne: false
            referencedRelation: "desafios"
            referencedColumns: ["id"]
          },
        ]
      }
      desafios: {
        Row: {
          ativo: boolean
          autor_id: string | null
          created_at: string
          descricao: string | null
          id: string
          meta: number
          pontos: number
          tipo: string
          titulo: string
          turma_id: string | null
        }
        Insert: {
          ativo?: boolean
          autor_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          meta?: number
          pontos?: number
          tipo?: string
          titulo: string
          turma_id?: string | null
        }
        Update: {
          ativo?: boolean
          autor_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          meta?: number
          pontos?: number
          tipo?: string
          titulo?: string
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "desafios_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
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
      frequencias: {
        Row: {
          aluno_id: string
          data: string
          disciplina_id: string
          id: string
          presente: boolean
          turma_id: string
        }
        Insert: {
          aluno_id: string
          data: string
          disciplina_id: string
          id?: string
          presente?: boolean
          turma_id: string
        }
        Update: {
          aluno_id?: string
          data?: string
          disciplina_id?: string
          id?: string
          presente?: boolean
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frequencias_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencias_turma_id_fkey"
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
          conteudo_id: string | null
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
          conteudo_id?: string | null
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
          conteudo_id?: string | null
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
            foreignKeyName: "provas_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
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
          conteudo_id: string | null
          created_at: string
          disciplina_id: string | null
          enunciado: string
          figura: Json | null
          id: string
          status: string
        }
        Insert: {
          alternativas: Json
          area: string
          autor_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_exame"]
          conteudo_id?: string | null
          created_at?: string
          disciplina_id?: string | null
          enunciado: string
          figura?: Json | null
          id?: string
          status?: string
        }
        Update: {
          alternativas?: Json
          area?: string
          autor_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_exame"]
          conteudo_id?: string | null
          created_at?: string
          disciplina_id?: string | null
          enunciado?: string
          figura?: Json | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
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
      recompensas: {
        Row: {
          ativo: boolean
          created_at: string
          custo: number
          descricao: string | null
          estoque: number | null
          id: string
          titulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo: number
          descricao?: string | null
          estoque?: number | null
          id?: string
          titulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo?: number
          descricao?: string | null
          estoque?: number | null
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      resgates: {
        Row: {
          aluno_id: string
          created_at: string
          custo: number
          id: string
          recompensa_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          custo: number
          id?: string
          recompensa_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          custo?: number
          id?: string
          recompensa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resgates_recompensa_id_fkey"
            columns: ["recompensa_id"]
            isOneToOne: false
            referencedRelation: "recompensas"
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
          conteudo_id: string | null
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
          conteudo_id?: string | null
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
          conteudo_id?: string | null
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
            foreignKeyName: "tarefas_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
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
      avaliar_comunicado: {
        Args: { _aprovar: boolean; _id: string; _motivo?: string }
        Returns: undefined
      }
      comunicado_para_mim: {
        Args: { c: Database["public"]["Tables"]["comunicados"]["Row"] }
        Returns: boolean
      }
      conceder_desafio: {
        Args: { _aluno: string; _desafio: string }
        Returns: undefined
      }
      definir_papel: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: undefined
      }
      desempenho_por_conteudo: {
        Args: { _aluno: string }
        Returns: {
          acertos: number
          conteudo: string
          disciplina: string
          total: number
        }[]
      }
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
      is_direcao: { Args: { _u: string }; Returns: boolean }
      is_gestao: { Args: { _user_id: string }; Returns: boolean }
      notificar_comunicado: { Args: { _id: string }; Returns: undefined }
      pode_gerir_questoes: { Args: { _u: string }; Returns: boolean }
      prof_da_turma: { Args: { _turma: string }; Returns: boolean }
      progresso_desafio: {
        Args: { _aluno: string; _desafio: string }
        Returns: number
      }
      ranking_turma: {
        Args: { _turma: string }
        Returns: {
          aluno_id: string
          nome: string
          pontos: number
        }[]
      }
      resgatar_desafio: { Args: { _desafio: string }; Returns: number }
      saldo_pontos: { Args: { _aluno: string }; Returns: number }
      trocar_recompensa: { Args: { _recompensa: string }; Returns: undefined }
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
