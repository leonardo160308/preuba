/* assets/js/data/challenges.js */

export const challengesData = [
    // ==========================================
    // NIVEL PRINCIPIANTE (Fáciles)
    // ==========================================
    {
        id: 1,
        title: "Primer Registro",
        description: "Registra tu primer movimiento financiero en el dashboard.",
        reward_wood: 5,
        required_data: "1_movements"
    },
    {
        id: 2,
        title: "Semana Organizada",
        description: "Registra al menos 5 movimientos en una semana.",
        reward_wood: 5,
        required_data: "5_movements"
    },
    {
        id: 3,
        title: "Control Semanal",
        description: "Registra al menos 7 movimientos (uno por día durante una semana).",
              reward_wood: 5,

        required_data: "7_movements"
    },
    {
        id: 4,
        title: "Primer Ahorro",
        description: "Registra tu primer ingreso en la categoría 'Ahorro'.",
             reward_wood: 5,

        required_data: "first_ahorro"
    },
    {
        id: 5,
        title: "Balance Positivo",
        description: "Logra que tus ingresos superen tus gastos en el mes actual.",
             reward_wood: 5,
        required_data: "positive_balance"
    },

    // ==========================================
    // NIVEL INTERMEDIO (Moderados)
    // ==========================================
    {
        id: 6,
        title: "Registrador Activo",
        description: "Registra al menos 15 movimientos en total.",
   reward_wood: 6,
        required_data: "15_movements"
    },
    {
        id: 7,
        title: "Experto en Registros",
        description: "Alcanza 25 movimientos registrados en total.",
   reward_wood: 6,
        required_data: "25_movements"
    },
    {
        id: 8,
        title: "Controlador Financiero",
        description: "Registra 40 movimientos en total.",
reward_wood: 6,

        required_data: "40_movements"
    },
    {
        id: 9,
        title: "Maestro de las Finanzas",
        description: "Logra registrar 60 movimientos en total.",
reward_wood: 6,

        required_data: "60_movements"
    },
    {
        id: 10,
        title: "Gurú Financiero",
        description: "Registra 100 movimientos en total.",
reward_wood: 6,

        required_data: "100_movements"
    },

    // ==========================================
    // RETOS DE AHORRO
    // ==========================================
    {
        id: 11,
        title: "Ahorrador Novato",
        description: "Registra 3 ingresos en la categoría 'Ahorro'.",
    reward_wood: 6,

        required_data: "3_ahorros"
    },
    {
        id: 12,
        title: "Ahorrador Consistente",
        description: "Registra 5 ingresos en la categoría 'Ahorro'.",
     reward_wood: 6,

        required_data: "5_ahorros"
    },
    {
        id: 13,
        title: "Ahorrador Experto",
        description: "Registra 10 ingresos en la categoría 'Ahorro'.",
reward_wood: 6,

        required_data: "10_ahorros"
    },
    {
        id: 14,
        title: "Ahorrador Maestro",
        description: "Acumula $500 o más en movimientos de 'Ahorro' en el mes actual.",
  reward_wood: 6,

        required_data: "500_ahorro_mes"
    },
    {
        id: 15,
        title: "Ahorrador Legendario",
        description: "Acumula $1000 o más en movimientos de 'Ahorro' en el mes actual.",
    reward_wood: 6,
        required_data: "1000_ahorro_mes"
    },

    // ==========================================
    // RETOS DE CONTROL DE GASTOS
    // ==========================================
    {
        id: 16,
        title: "Control de Vivienda",
        description: "Registra tu gasto de renta/vivienda del mes.",
        reward_wood: 6,
        required_data: "vivienda_expense"
    },
    {
        id: 17,
        title: "Control de Alimentación",
        description: "Registra al menos 5 gastos de alimentación.",
        reward_wood: 6,
        required_data: "5_alimentacion"
    },
    {
        id: 18,
        title: "Control de Transporte",
        description: "Registra 5 gastos de transporte.",
        reward_wood: 6,
        required_data: "5_transporte"
    },
    {
        id: 19,
        title: "Control de Servicios",
        description: "Registra tus gastos de servicios (luz, agua, internet, etc.).",
        reward_wood: 6,
        required_data: "3_servicios"
    },
    {
        id: 20,
        title: "Gastos Diversificados",
        description: "Registra movimientos en al menos 5 categorías diferentes.",
        reward_wood: 6,
        required_data: "5_categories_used"
    },

    // ==========================================
    // RETOS DE INGRESOS
    // ==========================================
    {
        id: 21,
        title: "Primer Salario Registrado",
        description: "Registra tu primer ingreso en la categoría 'Salario'.",
        reward_wood: 9,
        required_data: "first_salario"
    },
    {
        id: 22,
        title: "Ingresos Extra",
        description: "Registra un ingreso en 'Freelance' o 'Ventas'.",
        reward_wood: 9,
        required_data: "freelance_or_ventas"
    },
    {
        id: 23,
        title: "Inversionista Inicial",
        description: "Registra tu primer movimiento en 'Inversiones'.",
        reward_wood: 9,
        required_data: "first_inversion"
    },
    {
        id: 24,
        title: "Múltiples Fuentes de Ingreso",
        description: "Registra ingresos en al menos 3 categorías diferentes (Salario, Freelance, Ventas, Inversiones).",
        reward_wood: 9,
        required_data: "3_income_sources"
    },

    // ==========================================
    // RETOS DE BALANCE
    // ==========================================
    {
        id: 25,
        title: "Mes Equilibrado",
        description: "Termina el mes con un balance de exactamente $0 (ingresos = gastos).",
        reward_wood: 9,
        required_data: "balanced_month"
    },
    {
        id: 26,
        title: "Mes Rentable",
        description: "Termina el mes con un balance positivo de $100 o más.",
        reward_wood: 9,
        required_data: "100_profit_month"
    },
    {
        id: 27,
        title: "Mes Altamente Rentable",
        description: "Termina el mes con un balance positivo de $500 o más.",
        reward_wood: 9,
        required_data: "500_profit_month"
    },
    {
        id: 28,
        title: "Campeón de Ahorro",
        description: "Termina el mes con un balance positivo de $1000 o más.",
        reward_wood: 9,
        required_data: "1000_profit_month"
    },

    // ==========================================
    // RETOS ESPECIALES
    // ==========================================
    {
        id: 29,
        title: "Educación Financiera",
        description: "Registra un gasto en la categoría 'Educación'.",
        reward_wood: 9,
        required_data: "educacion_expense"
    },
    {
        id: 30,
        title: "Cuida tu Salud",
        description: "Registra un gasto en la categoría 'Salud'.",
        reward_wood: 9,
        required_data: "salud_expense"
    }
];