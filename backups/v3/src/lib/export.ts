import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export function exportToExcel(data: any[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToPDF(data: any[], fileName: string) {
    const doc = new jsPDF();

    const tableColumn = ["Cliente", "Data", "Pax", "Fonte", "Status", "Preço"];
    const tableRows = data.map(item => [
        item.customerName,
        new Date(item.activityDate).toLocaleDateString(),
        item.pax,
        item.source,
        item.status,
        `${item.totalPrice?.toFixed(2)}€`
    ]);

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: 'grid',
        headStyles: { fillColor: [0, 119, 255] }
    });

    doc.text("Relatório de Reservas - DNA CRM", 14, 15);
    doc.save(`${fileName}.pdf`);
}
