// Display today's date
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`;
document.getElementById('current-date').textContent = todayStr;
document.getElementById('summary-date').value = todayStr;

document.getElementById('check-attendance').addEventListener('click', function() {
    const rows = document.querySelectorAll('#attendance-table tbody tr');
    let summaryData = [];
    rows.forEach(row => {
        const name = row.cells[0].textContent;
        const timeIn = row.querySelector('.time-in').value;
        const timeOut = row.querySelector('.time-out').value;
        const breakOut = row.querySelector('.break-out').value;
        const breakIn = row.querySelector('.break-in').value;
        const statusSelect = row.querySelector('.status');
        const statusMsgDiv = row.querySelector('.status-message');

        let statusMsg = '';
        let statusClass = '';

        // Manual status overrides
        if (statusSelect.value === 'absent') {
            statusMsg = 'Absent';
            statusClass = 'status-absent';
        } else if (statusSelect.value === 'on-leave') {
            statusMsg = 'On Leave';
            statusClass = 'status-on-leave';
        } else {
            // Lateness logic
            let lateToWork = false;
            let lateToBreak = false;
            let lateFromBreak = false;

            // Time In: 7:00–7:10am
            if (timeIn) {
                if (compareTime(timeIn, '07:00') < 0 || compareTime(timeIn, '07:10') > 0) {
                    lateToWork = true;
                }
            } else {
                statusMsg = 'Absent';
                statusClass = 'status-absent';
            }

            // Break Out: 11:00–12:00pm
            if (breakOut) {
                if (compareTime(breakOut, '11:00') < 0 || compareTime(breakOut, '12:00') > 0) {
                    lateToBreak = true;
                }
            }

            // Break In: must be <= 12:00pm
            if (breakIn) {
                if (compareTime(breakIn, '12:00') > 0) {
                    lateFromBreak = true;
                }
            }

            // Compose status message
            if (statusMsg !== 'Absent') {
                let lateMessages = [];
                if (lateToWork) lateMessages.push('Late to Work');
                if (lateToBreak) lateMessages.push('Late to Break');
                if (lateFromBreak) lateMessages.push('Late from Break');

                if (lateMessages.length === 0) {
                    statusMsg = 'Present';
                    statusClass = 'status-present';
                } else if (lateMessages.length === 1) {
                    statusMsg = lateMessages[0];
                    statusClass = lateMessages[0] === 'Late from Break' ? 'status-late-break' : 'status-late';
                } else {
                    statusMsg = lateMessages.join(' & ');
                    statusClass = 'status-multi-late';
                }
            }
        }

        // Set status cell styling and message
        statusMsgDiv.textContent = statusMsg;
        statusMsgDiv.className = `status-message ${statusClass}`;

        // Collect summary data for saving
        summaryData.push({
            name,
            timeIn,
            timeOut,
            breakOut,
            breakIn,
            status: statusMsg
        });
    });

    // Save summary to localStorage
    saveAttendanceSummary(todayStr, summaryData);
    alert('Attendance summary saved for ' + todayStr);
});

// Helper function to compare times (returns minutes difference)
function compareTime(t1, t2) {
    if (!t1 || !t2) return 0;
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    return (h1 * 60 + m1) - (h2 * 60 + m2);
}

// Save summary function
function saveAttendanceSummary(dateStr, summaryData) {
    let allSummaries = JSON.parse(localStorage.getItem('attendanceSummaries') || '{}');
    allSummaries[dateStr] = summaryData;
    localStorage.setItem('attendanceSummaries', JSON.stringify(allSummaries));
}

// Load summary function
document.getElementById('load-summary').addEventListener('click', function() {
    const dateStr = document.getElementById('summary-date').value;
    let allSummaries = JSON.parse(localStorage.getItem('attendanceSummaries') || '{}');
    const summaryData = allSummaries[dateStr];

    const outputDiv = document.getElementById('summary-output');
    outputDiv.innerHTML = '';
    if (!summaryData) {
        outputDiv.textContent = 'No attendance summary for this date.';
        return;
    }

    // Render summary table
    let html = `<table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Break Out</th>
                <th>Break In</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>`;
    summaryData.forEach(item => {
        html += `<tr>
            <td>${item.name}</td>
            <td>${item.timeIn || '-'}</td>
            <td>${item.timeOut || '-'}</td>
            <td>${item.breakOut || '-'}</td>
            <td>${item.breakIn || '-'}</td>
            <td>${item.status}</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    outputDiv.innerHTML = html;
});