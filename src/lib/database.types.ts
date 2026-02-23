export interface Deal {
  id: string;
  created_at: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_trim: string | null;
  province: string;
  deal_type: "quote" | "purchase";
  msrp: number;
  selling_price: number;
  payment_amount: number;
  payment_frequency: "monthly" | "biweekly";
  term_months: number;
  residual_value: number;
  down_payment: number;
  other_credits: number;
  due_on_delivery: number;
  fees: { name: string; amount: number }[];
  apr: number;
  money_factor: number;
  residual_percent: number;
  discount_percent: number;
  one_percent_rule: number;
  overall_grade: string;
  total_junk_fees: number;
  dealership_name: string | null;
  notes: string | null;
}

export type DealInsert = Omit<Deal, "id" | "created_at">;
