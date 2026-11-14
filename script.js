"use strict";

const STORAGE_KEY = "northstar-campus-students-v1";
const initialStudents = [
  { id: "2026001", name: "Aanya Sharma", email: "aanya.sharma@northstar.edu", course: "Computer Science", year: 2, score: 92.5, status: "Active" },
  { id: "2026002", name: "Arjun Mehta", email: "arjun.mehta@northstar.edu", course: "Data Science", year: 3, score: 86, status: "Active" },
  { id: "2026003", name: "Diya Patel", email: "diya.patel@northstar.edu", course: "Computer Science", year: 1, score: 95, status: "Active" },
  { id: "2026004", name: "Kabir Verma", email: "kabir.verma@northstar.edu", course: "Information Technology", year: 4, score: 78.5, status: "On leave" },
  { id: "2026005", name: "Meera Nair", email: "meera.nair@northstar.edu", course: "Data Science", year: 2, score: 89, status: "Active" },
  { id: "2026006", name: "Rohan Gupta", email: "rohan.gupta@northstar.edu", course: "Business Analytics", year: 3, score: 81.5, status: "Active" },
  { id: "2026007", name: "Sana Khan", email: "sana.khan@northstar.edu", course: "Information Technology", year: 1, score: 90, status: "Inactive" },
  { id: "2026008", name: "Vivaan Rao", email: "vivaan.rao@northstar.edu", course: "Computer Science", year: 4, score: 84, status: "Active" },
  { id: "2026009", name: "Tara Iyer", email: "tara.iyer@northstar.edu", course: "Business Analytics", year: 2, score: 88, status: "Active" }
];

let students = loadStudents();
let sortKey = "name";
let sortDirection = "asc";
let toastTimeout;

const ui = {
  rows: document.querySelector("#student-rows"),
  search: document.querySelector("#table-search"),
  globalSearch: document.querySelector("#global-search"),
  searchMode: document.querySelector("#search-mode"),
  courseFilter: document.querySelector("#course-filter"),
  sortKey: document.querySelector("#sort-key"),
  direction: document.querySelector("#sort-direction"),
  note: document.querySelector("#algorithm-note"),
  dialog: document.querySelector("#student-dialog"),
  form: document.querySelector("#student-form"),
  error: document.querySelector("#form-error"),
  toast: document.querySelector("#toast")
};

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return initialStudents.map((student) => ({ ...student }));
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isStudent).slice(0, 500) : initialStudents.map((student) => ({ ...student }));
  } catch {
    return initialStudents.map((student) => ({ ...student }));
  }
}

function isStudent(student) {
  return student && typeof student.id === "string" && typeof student.name === "string" &&
    typeof student.email === "string" && typeof student.course === "string" &&
    Number.isFinite(Number(student.year)) && Number.isFinite(Number(student.score)) &&
    ["Active", "On leave", "Inactive"].includes(student.status);
}

function saveStudents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch {
    showToast("The browser could not save changes on this device.");
  }
}

function compareRecords(left, right, key) {
  if (key === "year" || key === "score") return Number(left[key]) - Number(right[key]);
  return String(left[key]).localeCompare(String(right[key]), undefined, { numeric: key === "id", sensitivity: "base" });
}

// Stable merge sort splits the roster, sorts both halves, and merges them.
function mergeSort(records, key, direction = "asc") {
  if (records.length < 2) return records.slice();
  const middle = Math.floor(records.length / 2);
  const left = mergeSort(records.slice(0, middle), key, direction);
  const right = mergeSort(records.slice(middle), key, direction);
  const merged = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    const order = compareRecords(left[leftIndex], right[rightIndex], key);
    const takeLeft = direction === "asc" ? order <= 0 : order >= 0;
    merged.push(takeLeft ? left[leftIndex++] : right[rightIndex++]);
  }
  return merged.concat(left.slice(leftIndex), right.slice(rightIndex));
}

// Binary search works on a copy already sorted by student ID.
function binarySearchById(sortedRecords, targetId) {
  const target = targetId.trim().toLocaleLowerCase();
  let low = 0;
  let high = sortedRecords.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const order = sortedRecords[middle].id.toLocaleLowerCase().localeCompare(target, undefined, { numeric: true });
    if (order === 0) return sortedRecords[middle];
    if (order < 0) low = middle + 1;
    else high = middle - 1;
  }
  return null;
}

function linearSearch(records, text) {
  const query = text.trim().toLocaleLowerCase();
  return records.filter((student) => [student.id, student.name, student.email, student.course, student.year, student.score]
    .some((value) => String(value).toLocaleLowerCase().includes(query)));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function initials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0].toLocaleUpperCase()).join("");
}

function formattedScore(score) {
  const value = Number(score);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function currentQuery() {
  return ui.search.value.trim();
}

function visibleStudents() {
  const query = currentQuery();
  let result;
  if (!query) result = students.slice();
  else if (ui.searchMode.value === "binary") {
    const sortedById = mergeSort(students, "id", "asc");
    const found = binarySearchById(sortedById, query);
    result = found ? [found] : [];
  } else result = linearSearch(students, query);

  if (ui.courseFilter.value) result = result.filter((student) => student.course === ui.courseFilter.value);
  return mergeSort(result, sortKey, sortDirection);
}

function updateDate() {
  const today = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  document.querySelector("#today-label").textContent = today;
}

function updateCourseFilter() {
  const selected = ui.courseFilter.value;
  const courses = [...new Set(students.map((student) => student.course))].sort((a, b) => a.localeCompare(b));
  ui.courseFilter.innerHTML = '<option value="">All programs</option>' + courses.map((course) =>
    `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`).join("");
  if (courses.includes(selected)) ui.courseFilter.value = selected;
}

function renderStats() {
  const total = students.length;
  const active = students.filter((student) => student.status === "Active").length;
  const average = total ? students.reduce((sum, student) => sum + Number(student.score), 0) / total : 0;
  const programs = new Set(students.map((student) => student.course)).size;
  const activePercent = total ? Math.round(active / total * 100) : 0;

  document.querySelector("#stat-total").textContent = String(total);
  document.querySelector("#stat-active").textContent = String(active);
  document.querySelector("#active-rate").textContent = `${activePercent}% of roster`;
  document.querySelector("#active-meter").style.width = `${activePercent}%`;
  document.querySelector("#stat-average").textContent = total ? `${average.toFixed(1)}%` : "—";
  document.querySelector("#score-meter").style.width = `${Math.min(average, 100)}%`;
  document.querySelector("#stat-programs").textContent = String(programs);
  document.querySelector("#nav-student-count").textContent = String(total);
}

function renderYearChart() {
  const counts = [1, 2, 3, 4, 5].map((year) => students.filter((student) => Number(student.year) === year).length);
  const maximum = Math.max(1, ...counts);
  const chart = document.querySelector("#year-chart");
  chart.setAttribute("aria-label", `Student counts by year of study: ${counts.map((count, index) => `year ${index + 1}: ${count}`).join(", ")}`);
  chart.innerHTML = counts.map((count, index) => {
    const height = count ? Math.max(8, Math.round(count / maximum * 100)) : 0;
    return `<div class="bar-column"><span class="bar-count">${count}</span><div class="bar-track"><span class="bar-fill" style="height:${height}%"></span></div><span class="bar-label">Year ${index + 1}</span></div>`;
  }).join("");
  document.querySelector("#year-chart-total").textContent = `${students.length} students`;
}

function renderPrograms() {
  const counts = new Map();
  students.forEach((student) => counts.set(student.course, (counts.get(student.course) || 0) + 1));
  const programs = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 3);
  const container = document.querySelector("#program-list");
  if (!programs.length) {
    container.innerHTML = '<p class="program-empty">No programs in the roster yet.</p>';
    return;
  }
  const maxCount = Math.max(...programs.map((item) => item[1]));
  container.innerHTML = programs.map(([name, count]) => `<div class="program-row"><span class="program-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span><span class="program-value">${count} student${count === 1 ? "" : "s"}</span><div class="program-meter"><span style="width:${Math.round(count / maxCount * 100)}%"></span></div></div>`).join("");
}

function renderAlgorithmNote() {
  const query = currentQuery();
  if (query && ui.searchMode.value === "binary") {
    const match = binarySearchById(mergeSort(students, "id", "asc"), query);
    ui.note.textContent = match ? "Binary search found an exact student ID · O(log n) search on a sorted copy." : "Binary search found no exact ID match · enter the student's full ID.";
  } else if (query) {
    ui.note.textContent = `Linear search scanned ${students.length} records · O(n). Sort uses merge sort · O(n log n).`;
  } else {
    ui.note.textContent = `${students.length} records · search by all fields or switch to binary search for an exact ID · merge sort is active.`;
  }
}

function statusClass(status) {
  if (status === "On leave") return "status-pill status-leave";
  if (status === "Inactive") return "status-pill status-inactive";
  return "status-pill";
}

function renderStudents() {
  updateCourseFilter();
  const records = visibleStudents();
  document.querySelector("#roster-count").textContent = String(records.length);
  document.querySelector("#showing-count").textContent = `Showing ${records.length} of ${students.length} student${students.length === 1 ? "" : "s"}`;
  ui.rows.innerHTML = records.map((student, index) => `
    <tr>
      <td><div class="student-cell"><span class="student-avatar tone-${index % 4}" aria-hidden="true">${escapeHtml(initials(student.name))}</span><span class="student-copy"><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.email)}</span></span></div></td>
      <td><span class="id-text">${escapeHtml(student.id)}</span></td>
      <td><span class="program-chip" title="${escapeHtml(student.course)}">${escapeHtml(student.course)}</span></td>
      <td>Year ${escapeHtml(student.year)}</td>
      <td><span class="score-text">${escapeHtml(formattedScore(student.score))}</span><span class="score-unit">%</span></td>
      <td><span class="${statusClass(student.status)}">${escapeHtml(student.status)}</span></td>
      <td><div class="row-actions"><button class="row-action" type="button" data-action="edit" data-id="${escapeHtml(student.id)}" aria-label="Edit ${escapeHtml(student.name)}" title="Edit record"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.8 4.1 3.1 3.1M4 16l3.1-.6 8.5-8.5a1.4 1.4 0 0 0-2-2l-8.5 8.5L4 16Z"/></svg></button><button class="row-action delete" type="button" data-action="delete" data-id="${escapeHtml(student.id)}" aria-label="Delete ${escapeHtml(student.name)}" title="Delete record"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6h11m-9.5 0 .6 10h5.8L13 6M8 6V4h4v2m-3 3v4m2-4v4"/></svg></button></div></td>
    </tr>`).join("");

  const empty = records.length === 0;
  document.querySelector("#empty-state").hidden = !empty;
  if (empty) {
    const noStudents = students.length === 0;
    document.querySelector("#empty-title").textContent = noStudents ? "Your roster is ready to grow" : "No students found";
    document.querySelector("#empty-copy").textContent = noStudents ? "Add the first student to start your directory." : "Try a different search or update the filters.";
    document.querySelector("#clear-filters").hidden = noStudents;
  }
  renderAlgorithmNote();
}

function renderDashboard() {
  renderStats();
  renderYearChart();
  renderPrograms();
  renderStudents();
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => ui.toast.classList.remove("is-visible"), 2600);
}

function openStudentForm(student = null) {
  ui.form.reset();
  ui.error.hidden = true;
  document.querySelector("#dialog-title").textContent = student ? "Edit student" : "Add student";
  document.querySelector("#save-student").textContent = student ? "Save changes" : "Save student";
  document.querySelector("#student-id").readOnly = Boolean(student);
  if (student) {
    document.querySelector("#student-id").value = student.id;
    document.querySelector("#student-name").value = student.name;
    document.querySelector("#student-email").value = student.email;
    document.querySelector("#student-course").value = student.course;
    document.querySelector("#student-year").value = String(student.year);
    document.querySelector("#student-score").value = String(student.score);
    document.querySelector("#student-status").value = student.status;
  }
  ui.dialog.showModal();
  (student ? document.querySelector("#student-name") : document.querySelector("#student-id")).focus();
}

function saveStudent(event) {
  event.preventDefault();
  const data = new FormData(ui.form);
  const student = {
    id: String(data.get("id")).trim(),
    name: String(data.get("name")).trim(),
    email: String(data.get("email")).trim(),
    course: String(data.get("course")).trim(),
    year: Number(data.get("year")),
    score: Number(data.get("score")),
    status: String(data.get("status"))
  };
  const editing = document.querySelector("#student-id").readOnly;
  const duplicate = students.some((record) => record.id.toLocaleLowerCase() === student.id.toLocaleLowerCase() && record.id !== student.id);
  if (duplicate) {
    ui.error.textContent = "That student ID is already in use. Choose a unique ID.";
    ui.error.hidden = false;
    return;
  }
  if (!student.name || !student.email || !student.course || !Number.isFinite(student.score) || student.score < 0 || student.score > 100) {
    ui.error.textContent = "Complete each field and enter a score from 0 to 100.";
    ui.error.hidden = false;
    return;
  }
  students = editing ? students.map((record) => record.id === student.id ? student : record) : [...students, student];
  saveStudents();
  ui.dialog.close();
  renderDashboard();
  showToast(editing ? "Student record updated." : "Student added to the roster.");
}

function deleteStudent(id) {
  const record = students.find((student) => student.id === id);
  if (!record || !window.confirm(`Delete the student record for ${record.name}?`)) return;
  students = students.filter((student) => student.id !== id);
  saveStudents();
  renderDashboard();
  showToast("Student record deleted.");
}

function exportCsv() {
  const rows = visibleStudents();
  const header = ["Student ID", "Full name", "Email", "Program", "Year", "Score", "Status"];
  const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [header, ...rows.map((student) => [student.id, student.name, student.email, student.course, student.year, student.score, student.status])]
    .map((row) => row.map(quote).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "northstar-student-records.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`${rows.length} record${rows.length === 1 ? "" : "s"} exported.`);
}

function setSearchMode() {
  const placeholder = ui.searchMode.value === "binary" ? "Enter an exact student ID…" : "Search by name, ID, email…";
  ui.search.placeholder = placeholder;
  ui.globalSearch.placeholder = ui.searchMode.value === "binary" ? "Enter exact student ID…" : "Search students…";
  renderStudents();
}

document.querySelector("#add-student-button").addEventListener("click", () => openStudentForm());
document.querySelector("#roster-add-button").addEventListener("click", () => openStudentForm());
document.querySelector("#close-dialog").addEventListener("click", () => ui.dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => ui.dialog.close());
ui.form.addEventListener("submit", saveStudent);
ui.search.addEventListener("input", () => {
  if (ui.globalSearch.value !== ui.search.value) ui.globalSearch.value = ui.search.value;
  renderStudents();
});
ui.globalSearch.addEventListener("input", () => {
  ui.search.value = ui.globalSearch.value;
  renderStudents();
});
ui.searchMode.addEventListener("change", setSearchMode);
ui.courseFilter.addEventListener("change", renderStudents);
ui.sortKey.addEventListener("change", () => { sortKey = ui.sortKey.value; renderStudents(); });
ui.direction.addEventListener("click", () => {
  sortDirection = sortDirection === "asc" ? "desc" : "asc";
  const descending = sortDirection === "desc";
  ui.direction.classList.toggle("is-desc", descending);
  ui.direction.setAttribute("aria-label", `Sort ${descending ? "descending" : "ascending"}`);
  ui.direction.title = `Sort ${descending ? "descending" : "ascending"}`;
  renderStudents();
});
ui.rows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const record = students.find((student) => student.id === button.dataset.id);
  if (button.dataset.action === "edit" && record) openStudentForm(record);
  if (button.dataset.action === "delete") deleteStudent(button.dataset.id);
});
document.querySelector("#clear-filters").addEventListener("click", () => {
  ui.search.value = "";
  ui.globalSearch.value = "";
  ui.courseFilter.value = "";
  renderStudents();
  ui.search.focus();
});
document.querySelector("#export-button").addEventListener("click", exportCsv);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !ui.dialog.open && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    ui.globalSearch.focus();
  }
});

updateDate();
renderDashboard();
