const stripBom = (s: string | undefined): string => (s ?? '').replace(/^﻿/, '').trim()

export const TAX_RATES = { gst: 0.05, qst: 0.09975 } as const

export function computeTaxBreakdown(baseCents: number) {
  const gst = Math.round(baseCents * TAX_RATES.gst)
  const qst = Math.round(baseCents * TAX_RATES.qst)
  return { baseCents, gstCents: gst, qstCents: qst, totalCents: baseCents + gst + qst }
}

export const SQUARE_SERVICE_VARIATIONS = {
  yin: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_YIN_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_YIN_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_YIN_BASE_CENTS ?? 4600),
    serviceName: 'Regular Class',
    maxSeats: Number(import.meta.env.VITE_SQUARE_MAX_SEATS ?? 20),
  },
  gentle: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_GENTLE_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_GENTLE_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_GENTLE_BASE_CENTS ?? 4600),
    serviceName: 'Private Event',
    maxSeats: Number(import.meta.env.VITE_SQUARE_MAX_SEATS ?? 20),
  },
  corporate: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_CORP_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_CORP_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_CORP_BASE_CENTS ?? 4600),
    serviceName: 'Corporate Event',
    maxSeats: Number(import.meta.env.VITE_SQUARE_MAX_SEATS ?? 20),
  },
}
