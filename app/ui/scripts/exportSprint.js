		// Helper to add borders to a row
		function addBorders(row) {
			row.eachCell(cell => {
				cell.border = {
					top: { style: 'thin', color: { argb: 'FFAAAAAA' } },
					left: { style: 'thin', color: { argb: 'FFAAAAAA' } },
					bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
					right: { style: 'thin', color: { argb: 'FFAAAAAA' } }
				};
			});
		}
// Export a sprint to Excel using exceljs and teams.json
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const teamsPath = path.join(process.cwd(), 'app', 'data', 'teams.json');

async function exportSprintToExcel(teamName, sprintIndex) {
	try {
		const data = fs.readFileSync(teamsPath, 'utf-8');
		const teamsArr = JSON.parse(data);
		const teamObj = teamsArr.find(t => t.name === teamName);
		if (!teamObj || !Array.isArray(teamObj.sprints) || !teamObj.sprints[sprintIndex]) {
			throw new Error('Team or sprint not found');
		}
		const sprint = teamObj.sprints[sprintIndex];
		const workbook = new ExcelJS.Workbook();
		const sheet = workbook.addWorksheet('Sprint');
		// Sprint info
		// Sprint info rows with colored labels and values
		const infoRows = [
			['Sprint Name', sprint.name],
			['Start Date', sprint.startDate],
			['End Date', sprint.endDate],
			// ['Capacity Planned', sprint.capacity]
		];
		infoRows.forEach(arr => {
			const row = sheet.addRow(arr);
			// Label cell (A): blue
			row.getCell(1).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFB4C6E7' }
			};
			row.getCell(1).font = { bold: true, size: 14 };
			row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
			// Value cell (B): light yellow
			row.getCell(2).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFFFF2CC' }
			};
			row.getCell(2).font = { size: 14 };
			row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
			addBorders(row);
		});
	addBorders(sheet.addRow([]));
		// Header row
		const headerRow = sheet.addRow(['Member', 'Total Capacity', 'Leaves', 'Scrum+Adhoc', 'Available', 'Relative Capacity', 'Spillover', 'Spillover Reason', 'Total SP', 'Tasks']);
		// Style header
		headerRow.eachCell((cell, colNumber) => {
			cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
			// Member column (1): blue, Total SP (9): green, Task (10): orange, others: purple
			if (colNumber === 1) {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
			} else if (colNumber === 9) {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
			} else if (colNumber === 10) {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB366' } };
			} else {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
			}
			cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
		});
		addBorders(headerRow);
		// Member rows and collect total SP
		// Prepare totals for all numeric columns
		let totals = [0,0,0,0,0,0,0,0]; // For columns 2-9 (1-based)
		if (Array.isArray(sprint.members)) {
			sprint.members.forEach((m, i) => {
				const vals = [
					m.totalCapacity,
					m.leaves,
					m.scrumAdhoc,
					m.available,
					m.relativeCapacity,
					m.spillover,
					m.totalSp
				];
				// Add to totals (skip name and reason/tasks)
				vals.forEach((v, idx) => {
					totals[idx] += Number(v) || 0;
				});
				const row = sheet.addRow([
					m.name,
					...vals.slice(0,2),
					vals[2],
					vals[3],
					vals[4],
					vals[5],
					m.spilloverReason,
					vals[6],
					m.tasks
				]);
				row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
				row.eachCell(cell => { cell.font = { size: 13 }; });
				// Light blue for name
				row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDAECF7' } };
				// Light green for Total SP
				row.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9F7BE' } };
				// Light purple for numeric columns (2-8)
				for (let c = 2; c <= 8; c++) {
					row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2FC' } };
				}
				// Light orange for Tasks (10)
				row.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
				addBorders(row);
			});
		}
		// Add total row for all numeric columns
		const totalRow = sheet.addRow([
			'Total',
			totals[0], // Total Capacity
			totals[1], // Leaves
			totals[2], // Scrum+Adhoc
			totals[3], // Available
			totals[4], // Relative Capacity
			totals[5], // Spillover
			'',        // Spillover Reason (not summed)
			totals[6], // Total SP
			''         // Tasks (not summed)
		]);
	totalRow.font = { bold: true, size: 14 };
		totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } };
		totalRow.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB7E1CD' } };
		for (let c = 2; c <= 8; c++) {
			totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2FC' } };
		}
		totalRow.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
		totalRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
		addBorders(totalRow);
		// Auto width for all columns
		sheet.columns.forEach(col => {
			let maxLength = 10;
			col.eachCell({ includeEmpty: true }, cell => {
				const val = cell.value ? cell.value.toString() : '';
				if (val.length > maxLength) maxLength = val.length;
			});
			col.width = maxLength + 2;
		});
	const safeTeam = teamObj.name.replace(/[^a-z0-9]/gi, '_');
	const safeSprint = sprint.name.replace(/[^a-z0-9]/gi, '_');
	const filePath = path.join(process.cwd(), `${safeTeam}_${safeSprint}.xlsx`);
		await workbook.xlsx.writeFile(filePath);
		return filePath;
	} catch (err) {
		console.error('Export failed:', err);
		throw err;
	}
}

module.exports = { exportSprintToExcel };
