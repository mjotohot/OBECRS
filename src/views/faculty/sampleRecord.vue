<script setup lang="ts">
import { computed } from 'vue'

/* ---------- sample data ---------- */
interface Assessment {
  abbreviation: string
  maxScore: number
}

interface CoGroup {
  code: string
  assessments: Assessment[]
}

const sampleCoGroups: CoGroup[] = [
  {
    code: 'CO1',
    assessments: [
      { abbreviation: 'ME-W', maxScore: 15 },
      { abbreviation: 'ME-HO', maxScore: 35 },
      { abbreviation: 'FE-W', maxScore: 30 },
      { abbreviation: 'FE-HO', maxScore: 50 },
      { abbreviation: 'LA1', maxScore: 50 },
      { abbreviation: 'LA2', maxScore: 16 },
      { abbreviation: 'LA3', maxScore: 16 },
      { abbreviation: 'LA4', maxScore: 16 },
      { abbreviation: 'LA5', maxScore: 16 },
      { abbreviation: 'LA6', maxScore: 50 },
      { abbreviation: 'LA7', maxScore: 50 },
      { abbreviation: 'LA8', maxScore: 50 },
      { abbreviation: 'LA9', maxScore: 50 },
      { abbreviation: 'LA10', maxScore: 35 },
      { abbreviation: 'LA11', maxScore: 100 },
    ],
  },
  {
    code: 'CO2',
    assessments: [
      { abbreviation: 'ME-W', maxScore: 5 },
      { abbreviation: 'FE-W', maxScore: 10 },
      { abbreviation: 'CPE1', maxScore: 40 },
      { abbreviation: 'PR1', maxScore: 10 },
      { abbreviation: 'PR2', maxScore: 10 },
    ],
  },
  {
    code: 'CO3',
    assessments: [
      { abbreviation: 'ME-W', maxScore: 5 },
      { abbreviation: 'FE-W', maxScore: 10 },
      { abbreviation: 'CPE2', maxScore: 30 },
      { abbreviation: 'PR3', maxScore: 10 },
      { abbreviation: 'PR4', maxScore: 10 },
    ],
  },
]

const students = [
  {
    id: 1,
    name: 'BRIONES, KATHLEEN CLAIRE',
    rawScores: [
      3.0, 5.0, 15.0, 50.0, 46.26, 0.0, 0.0, 13.0, 13.0, 0.0, 0.0, 20.0, 20.0, 22.0, 86.0, 1.0, 5.0,
      30.0, 10.0, 10.0, 1.0, 8.0, 20.0, 10.0, 10.0,
    ],
    co1Weight: 30,
    co2Weight: 12,
    co3Weight: 13,
    co1Percent: 49,
    co2Percent: 61,
    co3Percent: 67,
    finalWA: 55,
    finalGrade: '4.00',
    remarks: 'Intervention required. Highest possible grade is 3.0.',
    intervention: 'Intervention Failed',
    finalGradeAfter: 'INC',
  },
]

const gradingScale = [
  ['0.0%', '49.0%', '5.00'],
  ['55.0%', '59.0%', '4.00'],
  ['60.0%', '64.0%', '3.00'],
  ['65.0%', '69.0%', '2.75'],
  ['70.0%', '74.0%', '2.50'],
  ['75.0%', '79.0%', '2.25'],
  ['80.0%', '84.0%', '2.00'],
  ['85.0%', '88.0%', '1.75'],
  ['89.0%', '92.0%', '1.50'],
  ['93.0%', '96.0%', '1.25'],
  ['97.0%', '100.0%', '1.00'],
]

const gradingPolicy = [
  {
    condition: 'Grade in all course outcomes is greater than 60%',
    disposition: 'Pass. Refer to the grading table for the equivalent numerical grade',
  },
  {
    condition:
      'Average is greater than 60% but at least 1 of the course outcomes are with grade less than 60%',
    disposition:
      'Implement intervention/ conduct removal exam/ require additional assessment. The final grade is based on the original average.',
  },
  {
    condition: 'Average is lesser than 60% but 50% or more of the outcomes are attained.',
    disposition:
      'Implement intervention/ conduct removal exam/ require additional assessment. The highest grade obtained after passing the outcome is 3.0',
  },
  {
    condition:
      'Average is lesser than 60% and more than 50% of the number of course outcomes did not attain >= 50%',
    disposition: 'Failed. 5.0',
  },
]

/* ---------- computed helpers ---------- */
const allAssessments = computed(() => sampleCoGroups.flatMap((g) => g.assessments))
const totalRawCols = computed(() => allAssessments.value.length) // 25

const computePercentages = (student: any) => {
  return student.rawScores.map((score: number, i: number) => {
    const max = allAssessments.value[i]?.maxScore || 1
    return ((score / max) * 100).toFixed(1)
  })
}

const enrichedStudents = computed(() =>
  students.map((s) => ({
    ...s,
    percentages: computePercentages(s),
  })),
)
</script>

<template>
  <div
    class="class-record-container"
    style="padding: 16px; background: #fff; font-family: Helvetica, sans-serif; font-size: 8px"
  >
    <div style="overflow-x: auto">
      <table style="width: 100%; border-collapse: collapse; line-height: 1.1">
        <!-- ================= HEADER ================= -->
        <thead>
          <!-- 1) Course Information (spanning all columns: 1 + 25 raw + 25 pct + 9 summary = 60) -->
          <tr style="background: #fff">
            <th
              :colspan="1 + 2 * totalRawCols + 9"
              style="border: 1px solid #9ca3af; padding: 4px; text-align: left; font-size: 7px"
            >
              <h1
                style="
                  font-size: 20px;
                  font-weight: bold;
                  text-transform: uppercase;
                  margin: 0 0 4px;
                  text-align: center;
                "
              >
                Class Record
              </h1>
              <div style="border: 1px solid #9ca3af; padding: 6px; background: #f9fafb">
                <p style="margin: 2px 0"><strong>Course Information</strong></p>
                <p style="margin: 2px 0">
                  <strong>Course Code and Title:</strong> ITE 13: Intermediate Programming
                </p>
                <p style="margin: 2px 0"><strong>Sem/ AY:</strong> 1ST SEMESTER / AY 2025 - 2026</p>
                <p style="font-size: 7px; margin-top: 4px">
                  Instruction: This form shall document the Outcome‑Based Assessment of all students
                  enrolled in the course.
                </p>
              </div>
            </th>
          </tr>

          <!-- 2) Super category headers (only RAW SCORE and PERCENTAGE EQUIVALENT) -->
          <tr style="background: #f3f4f6">
            <th
              style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: center"
            ></th>
            <th
              :colspan="totalRawCols"
              style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: center"
            >
              RAW SCORE
            </th>
            <th
              :colspan="totalRawCols"
              style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: center"
            >
              PERCENTAGE EQUIVALENT
            </th>
            <!-- summary columns empty placeholder -->
            <td :colspan="9" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></td>
          </tr>

          <!-- 3) CO groups under Raw and Percentage -->
          <tr style="background: #f9fafb">
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></td>
            <template v-for="co in sampleCoGroups" :key="'raw-co-' + co.code">
              <th
                :colspan="co.assessments.length"
                style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"
              >
                {{ co.code }}
              </th>
            </template>
            <template v-for="co in sampleCoGroups" :key="'pct-co-' + co.code">
              <th
                :colspan="co.assessments.length"
                style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"
              >
                {{ co.code }}
              </th>
            </template>
            <td :colspan="9" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></td>
          </tr>

          <!-- 4) Competency labels (unchanged) -->
          <tr
            v-for="label in [
              'SDG Skills',
              '21st Century Skills',
              '6Cs',
              'C/P/A',
              'IGA',
              'Mapped PO',
            ]"
            :key="label"
            style="background: #fff"
          >
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: left">
              {{ label }}
            </th>
            <td
              :colspan="2 * totalRawCols + 9"
              style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"
            ></td>
          </tr>

          <!-- 5) Maximum raw score/percentage row + summary column headers -->
          <tr style="background: #f9fafb">
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: left">
              Maximum raw score/percentage
            </th>
            <!-- Raw max scores -->
            <template v-for="co in sampleCoGroups" :key="'max-' + co.code">
              <th
                v-for="asmt in co.assessments"
                :key="asmt.abbreviation"
                style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"
              >
                {{ asmt.maxScore }}
              </th>
            </template>
            <!-- Weight percentages under PERCENTAGE EQUIVALENT -->
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">7.50%</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">17.50%</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">7.50%</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">17.50%</th>
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
            <!-- Summary column headers (row for Maximum raw score/percentage) -->
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CO1</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CO2</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CO3</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CO1</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CO2</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">CO3</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">Final WA</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">Final Grade</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">Remarks/Status</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">Intervention</th>
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
              Final Grade After
            </th>
          </tr>

          <!-- 6) Assessment Tasks (AT) row + Wt% labels -->
          <tr style="background: #f9fafb">
            <th style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: left">
              Assessment Tasks (AT)
            </th>
            <template v-for="co in sampleCoGroups" :key="'raw-task-' + co.code">
              <th
                v-for="asmt in co.assessments"
                :key="asmt.abbreviation"
                style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"
              >
                {{ asmt.abbreviation }}
              </th>
            </template>
            <template v-for="co in sampleCoGroups" :key="'pct-task-' + co.code">
              <th
                v-for="asmt in co.assessments"
                :key="asmt.abbreviation"
                style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"
              >
                {{ asmt.abbreviation }}
              </th>
            </template>
            <!-- Summary Wt% labels for the first three columns, rest empty -->
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: center">
              Wt%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: center">
              Wt%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: center">
              Wt%
            </td>
            <td colspan="6" style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"></td>
          </tr>

          <!-- 7) Student ID / Name header (clean) -->
          <tr style="background: #f3f4f6">
            <th
              style="
                border: 1px solid #9ca3af;
                padding: 2px;
                font-size: 7px;
                text-align: left;
                vertical-align: middle;
              "
            >
              Student ID / Name
            </th>
            <td
              :colspan="2 * totalRawCols + 9"
              style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px"
            ></td>
          </tr>
        </thead>

        <!-- ================= BODY ================= -->
        <tbody>
          <tr v-for="student in enrichedStudents" :key="student.id">
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; font-weight: 500">
              {{ student.name }}
            </td>
            <td
              v-for="(score, i) in student.rawScores"
              :key="'rs-' + i"
              style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right"
            >
              {{ score }}
            </td>
            <td
              v-for="(pct, i) in student.percentages"
              :key="'pct-' + i"
              style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right"
            >
              {{ pct }}%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right">
              {{ student.co1Weight }}%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right">
              {{ student.co2Weight }}%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right">
              {{ student.co3Weight }}%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right">
              {{ student.co1Percent }}%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right">
              {{ student.co2Percent }}%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right">
              {{ student.co3Percent }}%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: right">
              {{ student.finalWA }}%
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px; text-align: center">
              {{ student.finalGrade }}
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
              {{ student.remarks }}
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
              {{ student.intervention }}
            </td>
            <td style="border: 1px solid #9ca3af; padding: 2px; font-size: 7px">
              {{ student.finalGradeAfter }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer (unchanged) -->
    <div style="margin-top: 32px; display: flex; justify-content: space-between; font-size: 10px">
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
</template>
