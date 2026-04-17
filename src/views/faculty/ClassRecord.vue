<template>
  <AdminLayout>
    <button @click="exportPDF" class="mb-4 px-4 py-2 bg-blue-600 text-white rounded">
      Export to PDF
    </button>
    <div id="class-record-container">
      <div class="p-4 bg-white print:p-0 font-sans text-[8px]">
        <!-- Course Information (same as before) -->
        <div class="mb-6 text-center">
          <h1 class="text-xl font-bold uppercase">Class Record</h1>
          <div class="mt-2 text-left border border-gray-400 p-2">
            <p><strong>Course Information</strong></p>
            <p><strong>Course Code and Title:</strong> ITE 13: Intermediate Programming</p>
            <p><strong>Sem/ AY:</strong> 1ST SEMESTER / AY 2025 - 2026</p>
            <p class="text-xs mt-1">
              Instruction: This form shall document the Outcome‑Based Assessment of all students
              enrolled in the course. It shall be accompanied by the Course‑Level Assessment Form
              with the corresponding Continuous Quality Improvement (CQI) plan to address not
              attained targets and ensure progressive enhancement of the course.
            </p>
          </div>
        </div>

        <!-- ========== MAIN TABLE – EXACT REPLICA ========== -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse leading-tight">
            <thead>
              <!-- ROW 1: Competencies, RAW SCORE, Grade Status, Disposition/Action -->
              <tr class="bg-gray-100">
                <th rowspan="5" class="border border-gray-400 p-1 align-middle">
                  Student ID / Name
                </th>
                <th colspan="25" class="border border-gray-400 p-1 text-center">RAW SCORE</th>
                <th colspan="3" class="border border-gray-400 p-1 text-center">
                  Grade Status at End of Semester
                </th>
                <th colspan="2" class="border border-gray-400 p-1 text-center">
                  Disposition/ Action
                </th>
                <th rowspan="5" class="border border-gray-400 p-1 align-middle">Mapped PO</th>
              </tr>

              <!-- ROW 2: CO1, CO2, CO3 repeated exactly -->
              <tr class="bg-gray-100">
                <!-- 15 x CO1 -->
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <th class="border border-gray-400 p-1">CO1</th>
                <!-- 5 x CO2 -->
                <th class="border border-gray-400 p-1">CO2</th>
                <th class="border border-gray-400 p-1">CO2</th>
                <th class="border border-gray-400 p-1">CO2</th>
                <th class="border border-gray-400 p-1">CO2</th>
                <th class="border border-gray-400 p-1">CO2</th>
                <!-- 5 x CO3 -->
                <th class="border border-gray-400 p-1">CO3</th>
                <th class="border border-gray-400 p-1">CO3</th>
                <th class="border border-gray-400 p-1">CO3</th>
                <th class="border border-gray-400 p-1">CO3</th>
                <th class="border border-gray-400 p-1">CO3</th>
                <!-- These cells are under Grade Status and Disposition/Action – they will be spanned from row 1 -->
                <!-- We leave empty cells here because the rowspan from row 1 covers them -->
              </tr>

              <!-- ROW 3: Assessment Tasks (AT) names -->
              <tr class="bg-gray-50">
                <!-- 15 CO1 tasks -->
                <th class="border border-gray-400 p-1">ME-W</th>
                <th class="border border-gray-400 p-1">ME-HO</th>
                <th class="border border-gray-400 p-1">FE-W</th>
                <th class="border border-gray-400 p-1">FE-HO</th>
                <th class="border border-gray-400 p-1">LA1</th>
                <th class="border border-gray-400 p-1">LA2</th>
                <th class="border border-gray-400 p-1">LA3</th>
                <th class="border border-gray-400 p-1">LA4</th>
                <th class="border border-gray-400 p-1">LA5</th>
                <th class="border border-gray-400 p-1">LA6</th>
                <th class="border border-gray-400 p-1">LA7</th>
                <th class="border border-gray-400 p-1">LA8</th>
                <th class="border border-gray-400 p-1">LA9</th>
                <th class="border border-gray-400 p-1">LA10</th>
                <th class="border border-gray-400 p-1">LA11</th>
                <!-- 5 CO2 tasks -->
                <th class="border border-gray-400 p-1">ME-W</th>
                <th class="border border-gray-400 p-1">FE-W</th>
                <th class="border border-gray-400 p-1">CPE1</th>
                <th class="border border-gray-400 p-1">PR1</th>
                <th class="border border-gray-400 p-1">PR2</th>
                <!-- 5 CO3 tasks -->
                <th class="border border-gray-400 p-1">ME-W</th>
                <th class="border border-gray-400 p-1">FE-W</th>
                <th class="border border-gray-400 p-1">CPE2</th>
                <th class="border border-gray-400 p-1">PR3</th>
                <th class="border border-gray-400 p-1">PR4</th>
                <!-- These cells are under Grade Status and Disposition/Action (spanned) -->
              </tr>

              <!-- ROW 4: Maximum raw score / percentage (perfect scores) -->
              <tr class="bg-gray-50">
                <th class="border border-gray-400 p-1">15</th>
                <th class="border border-gray-400 p-1">35</th>
                <th class="border border-gray-400 p-1">30</th>
                <th class="border border-gray-400 p-1">50</th>
                <th class="border border-gray-400 p-1">50</th>
                <th class="border border-gray-400 p-1">16</th>
                <th class="border border-gray-400 p-1">16</th>
                <th class="border border-gray-400 p-1">16</th>
                <th class="border border-gray-400 p-1">16</th>
                <th class="border border-gray-400 p-1">50</th>
                <th class="border border-gray-400 p-1">50</th>
                <th class="border border-gray-400 p-1">50</th>
                <th class="border border-gray-400 p-1">50</th>
                <th class="border border-gray-400 p-1">35</th>
                <th class="border border-gray-400 p-1">100</th>
                <th class="border border-gray-400 p-1">5</th>
                <th class="border border-gray-400 p-1">10</th>
                <th class="border border-gray-400 p-1">40</th>
                <th class="border border-gray-400 p-1">10</th>
                <th class="border border-gray-400 p-1">10</th>
                <th class="border border-gray-400 p-1">5</th>
                <th class="border border-gray-400 p-1">10</th>
                <th class="border border-gray-400 p-1">30</th>
                <th class="border border-gray-400 p-1">10</th>
                <th class="border border-gray-400 p-1">10</th>
                <!-- Empty cells for the spanned columns -->
                <th class="border border-gray-400 p-1"></th>
                <th class="border border-gray-400 p-1"></th>
                <th class="border border-gray-400 p-1"></th>
                <th class="border border-gray-400 p-1"></th>
                <th class="border border-gray-400 p-1"></th>
              </tr>

              <!-- ROW 5: PERFECT SCORE row (exactly as in PDF) -->
              <tr class="bg-gray-50">
                <td class="border border-gray-400 p-1 text-center" colspan="15"> </td>
                <td class="border border-gray-400 p-1 text-center" colspan="5"> </td>
                <td class="border border-gray-400 p-1 text-center" colspan="5"> </td>
                <td class="border border-gray-400 p-1 text-right">120.00%</td>
                <td class="border border-gray-400 p-1 text-right">66.67%</td>
                <td class="border border-gray-400 p-1 text-right">100.00%</td>
                <td class="border border-gray-400 p-1 text-right">100.00%</td>
                <td class="border border-gray-400 p-1 text-right">1.00</td>
                <td class="border border-gray-400 p-1 text-left font-bold">PERFECT SCORE</td>
                <td class="border border-gray-400 p-1 text-right">0%</td>
                <td class="border border-gray-400 p-1 text-right">0%</td>
                <td class="border border-gray-400 p-1 text-right">0%</td>
                <td class="border border-gray-400 p-1 text-right">0%</td>
                <td class="border border-gray-400 p-1 text-right">5.00</td>
                <td class="border border-gray-400 p-1 text-left">Failed</td>
                <td class="border border-gray-400 p-1"></td>
              </tr>
            </thead>

            <tbody>
              <!-- Student rows – exactly as in the PDF, using first two as examples -->
              <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50">
                <td class="border border-gray-400 p-1 font-medium whitespace-nowrap">
                  {{ student.name }}
                </td>
                <!-- 25 raw scores -->
                <td
                  v-for="(score, idx) in student.rawScores"
                  :key="'raw' + idx"
                  class="border border-gray-400 p-1 text-right"
                >
                  {{ score }}
                </td>
                <!-- CO1%, CO2%, CO3% -->
                <td class="border border-gray-400 p-1 text-right">{{ student.co1Percent }}%</td>
                <td class="border border-gray-400 p-1 text-right">{{ student.co2Percent }}%</td>
                <td class="border border-gray-400 p-1 text-right">{{ student.co3Percent }}%</td>
                <!-- Final WA, Final Grade, Remarks -->
                <td class="border border-gray-400 p-1 text-right">{{ student.finalWA }}%</td>
                <td class="border border-gray-400 p-1 text-center">{{ student.finalGrade }}</td>
                <td class="border border-gray-400 p-1 text-left text-xs">{{ student.remarks }}</td>
                <!-- Intervention and Final Grade after -->
                <td class="border border-gray-400 p-1 text-left text-xs">
                  {{ student.intervention }}
                </td>
                <td class="border border-gray-400 p-1 text-center">
                  {{ student.finalGradeAfter }}
                </td>
                <!-- Mapped PO (usually empty) -->
                <td class="border border-gray-400 p-1 text-center">{{ student.mappedPO }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="mt-8 flex justify-between text-sm">
          <div>
            <p>Prepared by:</p>
            <p class="font-bold mt-4">Edwin Manuel M. Jarlata</p>
            <p>Faculty</p>
            <p>Date: __________________</p>
          </div>
          <div class="text-right">
            <p>Approved by:</p>
            <p class="font-bold mt-4">DR. JAYMER M. JAYOMA</p>
            <p>Dean, College of Computing and Information Sciences</p>
            <p>Date: __________________</p>
          </div>
        </div>
        <div class="text-xs text-center mt-2">F-CID-022 Rev.0, 08/28/2025</div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AdminLayout from '@/components/layouts/AdminLayout.vue'

// Example data – replace with your full student list
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
  {
    id: 2,
    name: 'BULADACO, PRINCESS STEFANEY',
    rawScores: [
      6.0, 30.0, 14.0, 50.0, 43.13, 15.0, 7.0, 15.0, 15.0, 38.5, 38.5, 37.5, 37.5, 22.0, 91.0, 3.0,
      5.0, 40.0, 9.0, 10.0, 3.0, 5.0, 30.0, 9.5, 9.5,
    ],
    co1Percent: 65,
    co2Percent: 76,
    co3Percent: 76,
    finalWA: 69,
    finalGrade: '2.75',
    remarks: 'Pass',
    intervention: 'Passed',
    finalGradeAfter: '2.75',
    mappedPO: '',
  },
  // Add the remaining 40+ students here
])

computed(() => {
  // You can add any computed properties here if needed, such as totals or averages
})

const exportPDF = () => {
  window.print()
}
</script>

<style media="print">
/* Hide button and other non‑printable elements */
/* button {
  display: none;
} */
/* Ensure page is landscape, remove margins */
@page {
  size: landscape;
  margin: 0.5cm;
}
body {
  margin: 0;
  padding: 0;
}
/* Repeat thead on every page */
thead {
  display: table-header-group;
}
/* Prevent rows from breaking across pages */
tr {
  page-break-inside: avoid;
}
</style>
