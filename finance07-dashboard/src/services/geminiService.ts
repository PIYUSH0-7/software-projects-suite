import { GoogleGenAI } from "@google/genai";
import { CreditCard, Investment, Debt, Transaction, Plan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getFinancialAdvice(
  userData: {
    creditCards: CreditCard[];
    investments: Investment[];
    debts: Debt[];
    transactions: Transaction[];
    plans: Plan[];
  },
  query?: string
) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `You are a professional financial advisor. Analyze the following financial data and provide strategic advice.
            
            Credit Cards: ${JSON.stringify(userData.creditCards)}
            Investments: ${JSON.stringify(userData.investments)}
            Debts: ${JSON.stringify(userData.debts)}
            Recent Transactions: ${JSON.stringify(userData.transactions)}
            Upcoming Plans: ${JSON.stringify(userData.plans)}
            
            User Query: ${query || "Provide a general financial health check and advice on bill payments."}
            
            Focus on:
            1. Efficient credit card bill payments (which to pay first, how much).
            2. Debt reduction strategies.
            3. Investment growth suggestions.
            4. Budgeting improvements.
            5. Alerts for high credit utilization or overspending.
            
            Provide the response in Markdown format.`
          }
        ]
      }
    ]
  });

  const response = await model;
  return response.text;
}
