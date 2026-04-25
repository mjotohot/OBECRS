<script setup lang="ts">
import { ref } from 'vue'
import AdminLayout from '@/components/layouts/AdminLayout.vue'

const loading = ref(false)
const students = ref([
  {
    id: 1,
    name: 'BRIONES, KATHLEEN CLAIRE',
    rawScores: [
      3.0, 5.0, 15.0, 50.0, 46.26, 0.0, 0.0, 13.0, 13.0, 0.0, 0.0, 20.0, 20.0, 22.0, 86.0, 1.0, 5.0,
      30.0, 10.0, 10.0, 1.0, 8.0, 20.0, 10.0, 10.0,
    ],
    co1Percent: 43,
    co2Percent: 61,
    co3Percent: 67,
    finalWA: 51,
    finalGrade: '5.00',
    remarks: 'Failed',
    intervention: 'Intervention required. Highest possible grade is 3.0.',
    finalGradeAfter: 'INC',
    mappedPO: '',
  },
])

const exportPDF = async () => {
  loading.value = true
  try {
    const res = await fetch(
      'https://xgegivpmktyunrwmaktp.supabase.co/functions/v1/generated-class-record',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: students.value,
          courseInfo: {
            title: 'ITE 13: Intermediate Programming',
            semAy: '1ST SEMESTER / AY 2025 - 2026',
          },
        }),
      },
    )

    if (!res.ok) throw new Error('Server error')
    const { pdfBase64 } = await res.json()

    // Convert base64 to blob & download
    const byteChars = atob(pdfBase64)
    const byteNums = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i)
    }
    const byteArr = new Uint8Array(byteNums)
    const blob = new Blob([byteArr], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Class_Record.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    alert('Failed to generate PDF')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <button
      @click="exportPDF"
      :disabled="loading"
      style="
        margin-bottom: 16px;
        padding: 8px 16px;
        background-color: #2563eb;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      "
    >
      {{ loading ? 'Generating PDF...' : 'Export to PDF' }}
    </button>

    <div id="class-record-container">
      <div
        style="padding: 16px; background: #fff; font-family: Helvetica, sans-serif; font-size: 8px"
      >
        <!-- Course Information -->
        <div style="margin-bottom: 24px; text-align: center">
          <h1
            style="font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px"
          >
            Class Record
          </h1>
          <div style="margin-top: 8px; text-align: left; border: 1px solid #9ca3af; padding: 8px">
            <p style="margin: 2px 0"><strong>Course Information</strong></p>
            <p style="margin: 2px 0">
              <strong>Course Code and Title:</strong> ITE 13: Intermediate Programming
            </p>
            <p style="margin: 2px 0"><strong>Sem/ AY:</strong> 1ST SEMESTER / AY 2025 - 2026</p>
            <p style="font-size: 7px; margin-top: 4px">
              Instruction: This form shall document the Outcome‑Based Assessment of all students
              enrolled in the course. It shall be accompanied by the Course‑Level Assessment Form
              with the corresponding Continuous Quality Improvement (CQI) plan to address not
              attained targets and ensure progressive enhancement of the course.
            </p>
          </div>
        </div>

        <!-- Main Table + Grading Scale (side by side) -->
        <div style="display: flex; gap: 8px">
          <!-- MAIN TABLE (left, takes most width) -->
          <div style="flex: 1; overflow-x: auto">
            <table style="width: 100%; border-collapse: collapse; line-height: 1.1">
              <thead>
                <!-- ROW 0: Competencies / RAW SCORE / PERCENTAGE EQUIVALENT / Grade Status / Disposition / Source / Mapped PO -->
                <tr style="background: #f3f4f6">
                  <th
                    rowspan="6"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      vertical-align: middle;
                    "
                  >
                    Student ID / Name
                  </th>
                  <th
                    colspan="25"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  >
                    RAW SCORE
                  </th>
                  <th
                    colspan="25"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  >
                    PERCENTAGE EQUIVALENT
                  </th>
                  <th
                    colspan="3"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  >
                    Grade Status at End of Semester
                  </th>
                  <th
                    colspan="2"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  >
                    Disposition/ Action
                  </th>
                  <th
                    rowspan="6"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      vertical-align: middle;
                    "
                  >
                    Source
                  </th>
                  <th
                    rowspan="6"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      vertical-align: middle;
                    "
                  >
                    Mapped PO
                  </th>
                </tr>

                <!-- ROW 1: Competencies row -->
                <tr style="background: #f3f4f6">
                  <!-- RAW SCORE columns repeated for each CO -->
                  <th colspan="15" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
                    CO1
                  </th>
                  <th colspan="5" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
                    CO2
                  </th>
                  <th colspan="5" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
                    CO3
                  </th>
                  <!-- Percentage Equivalent columns (same CO grouping) -->
                  <th colspan="15" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
                    CO1
                  </th>
                  <th colspan="5" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
                    CO2
                  </th>
                  <th colspan="5" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
                    CO3
                  </th>
                  <!-- Grade Status / Disposition / Source / Mapped PO already spanned -->
                </tr>

                <!-- ROW 2: Assessment Task Names (for RAW SCORE part) -->
                <tr style="background: #f9fafb">
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">ME-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">ME-HO</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">FE-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">FE-HO</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA1</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA2</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA3</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA4</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA5</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA6</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA7</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA8</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA9</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA11</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">ME-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">FE-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CPE1</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">PR1</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">PR2</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">ME-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">FE-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CPE2</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">PR3</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">PR4</th>
                  <!-- Percentage Equivalent columns repeat the same task names (or you can use same labels) -->
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">ME-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">ME-HO</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">FE-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">FE-HO</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA1</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA2</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA3</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA4</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA5</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA6</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA7</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA8</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA9</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">LA11</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">ME-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">FE-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CPE1</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">PR1</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">PR2</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">ME-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">FE-W</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CPE2</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">PR3</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">PR4</th>
                  <!-- Empty cells for Grade Status, Disposition (spanned) -->
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <!-- Source, Mapped PO empty (spanned) -->
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                </tr>

                <!-- ROW 3: Maximum raw score (RAW SCORE part) -->
                <tr style="background: #f9fafb">
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">15</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">35</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">30</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">16</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">16</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">16</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">16</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">35</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">100</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">40</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">30</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <!-- Percentage Equivalent max scores (same as raw scores) -->
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">15</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">35</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">30</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">16</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">16</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">16</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">16</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">50</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">35</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">100</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">40</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">30</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">10</th>
                  <!-- Empty cells for Grade Status, Disposition, Source, Mapped PO -->
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                </tr>

                <!-- ROW 4: Wt% (Weight percentages) -->
                <tr style="background: #f9fafb">
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">7.50%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">17.50%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">7.50%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">17.50%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <!-- repeat for all 25 tasks… for brevity, we'll use placeholders or copy the pattern -->
                  <!-- ... you can fill exact Wt% values from the PDF -->
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">0.909%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5.00%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5.00%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5.00%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">2.50%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">2.50%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5.00%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5.00%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">5.00%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">2.50%</th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">2.50%</th>
                  <!-- Repeat same weights for PERCENTAGE EQUIVALENT section -->
                  <!-- ... (I'll skip to keep example manageable) -->
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                </tr>

                <!-- ROW 5: Perfect Score row (same as before) -->
                <tr style="background: #f9fafb">
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th
                    colspan="15"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  ></th>
                  <th
                    colspan="5"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  ></th>
                  <th
                    colspan="5"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  ></th>
                  <th
                    colspan="25"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  ></th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    120.00%
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    66.67%
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    100.00%
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    100.00%
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    1.00
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: left;
                      font-weight: bold;
                    "
                  >
                    PERFECT SCORE
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    0%
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    0%
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    0%
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    0%
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    5.00
                  </th>
                  <th
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: left;
                    "
                  >
                    Failed
                  </th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                  <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="student in students" :key="student.id">
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      font-weight: 500;
                    "
                  >
                    {{ student.name }}
                  </td>
                  <!-- 25 raw scores -->
                  <td
                    v-for="(score, i) in student.rawScores"
                    :key="'raw' + i"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    {{ score }}
                  </td>
                  <!-- 25 percentage equivalents (computed) -->
                  <!-- We'll compute percentages on the fly; for now dummy placeholder -->
                  <td
                    v-for="(score, i) in student.rawScores"
                    :key="'pct' + i"
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    {{ student.taskPercentages ? student.taskPercentages[i] : '—' }}
                  </td>
                  <!-- CO percentages -->
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    {{ student.co1Percent }}%
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    {{ student.co2Percent }}%
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    {{ student.co3Percent }}%
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: right;
                    "
                  >
                    {{ student.finalWA }}%
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  >
                    {{ student.finalGrade }}
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: left;
                    "
                  >
                    {{ student.remarks }}
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: left;
                    "
                  >
                    {{ student.intervention }}
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  >
                    {{ student.finalGradeAfter }}
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  >
                    {{ student.source || '—' }}
                  </td>
                  <td
                    style="
                      border: 1px solid #9ca3af;
                      padding: 2px;
                      font-size: 7px;
                      text-align: center;
                    "
                  >
                    {{ student.mappedPO }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Grading Scale (right side box) -->
          <div style="width: 200px; border: 1px solid #9ca3af; padding: 8px; font-size: 7px">
            <h4 style="margin: 0 0 4px">Grading Scale</h4>
            <table style="width: 100%; border-collapse: collapse">
              <tr>
                <td>0%</td>
                <td>49%</td>
                <td>5.00</td>
              </tr>
              <tr>
                <td>50%</td>
                <td>54%</td>
                <td>4.00</td>
              </tr>
              <tr>
                <td>55%</td>
                <td>59%</td>
                <td>3.00</td>
              </tr>
              <tr>
                <td>60%</td>
                <td>64%</td>
                <td>2.75</td>
              </tr>
              <tr>
                <td>65%</td>
                <td>69%</td>
                <td>2.50</td>
              </tr>
              <tr>
                <td>70%</td>
                <td>74%</td>
                <td>2.25</td>
              </tr>
              <tr>
                <td>75%</td>
                <td>79%</td>
                <td>2.00</td>
              </tr>
              <tr>
                <td>80%</td>
                <td>84%</td>
                <td>1.75</td>
              </tr>
              <tr>
                <td>85%</td>
                <td>88%</td>
                <td>1.50</td>
              </tr>
              <tr>
                <td>89%</td>
                <td>92%</td>
                <td>1.25</td>
              </tr>
              <tr>
                <td>93%</td>
                <td>96%</td>
                <td>1.00</td>
              </tr>
              <tr>
                <td>97%</td>
                <td>100%</td>
                <td>1.00</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer unchanged -->
        <div
          style="margin-top: 32px; display: flex; justify-content: space-between; font-size: 10px"
        >
          <div>
            <p style="margin: 2px 0">Prepared by:</p>
            <p style="font-weight: bold; margin: 16px 0 2px">Edwin Manuel M. Jarlata</p>
            <p style="margin: 2px 0">Faculty</p>
            <p style="margin: 2px 0">Date: __________________</p>
          </div>
          <div style="text-align: right">
            <p style="margin: 2px 0">Approved by:</p>
            <p style="font-weight: bold; margin: 16px 0 2px">DR. JAYMER M. JAYOMA</p>
            <p style="margin: 2px 0">Dean, College of Computing and Information Sciences</p>
            <p style="margin: 2px 0">Date: __________________</p>
          </div>
        </div>
        <div style="font-size: 7px; text-align: center; margin-top: 8px">
          F-CID-022 Rev.0, 08/28/2025
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
