type Post = {
    caption: string;
    pillar: string;
    slides: {
        title: string;
        body: string;
    }[];
};
export function downloadFile(data: Blob, filename: string) {
    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportCaption(post: Post) {
    downloadFile(new Blob([post.caption], { type: "text/plain;charset=utf-8" }), "signal-caption.txt");
}
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
    const lines: string[] = [];
    for (const paragraph of text.split("\n")) {
        let line = "";
        for (const word of paragraph.split(/\s+/)) {
            if (ctx.measureText(line + " " + word).width > width && line) {
                lines.push(line);
                line = "";
            }
            if (ctx.measureText(word).width > width) {
                for (const char of word) {
                    if (ctx.measureText(line + char).width > width) {
                        lines.push(line);
                        line = "";
                    }
                    line += char;
                }
            }
            else {
                line += (line ? " " : "") + word;
            }
        }
        lines.push(line);
    }
    return lines;
}
function textBox(ctx: CanvasRenderingContext2D, text: string, y: number, height: number, startSize: number, bold: boolean) {
    for (let size = startSize; size >= 22; size -= 2) {
        ctx.font = (bold ? "700 " : "400 ") + size + "px Arial, sans-serif";
        const lines = wrap(ctx, text, 860);
        const leading = size * 1.22;
        if (lines.length * leading <= height) {
            lines.forEach((line, index) => ctx.fillText(line, 110, y + index * leading));
            return;
        }
    }
    throw new Error("A slide has too much text to fit. Shorten it before exporting.");
}
export async function exportCarousel(post: Post, author: string) {
    if (!post.slides.length)
        throw new Error("Add slides before exporting a carousel.");
    const images: Uint8Array[] = [];
    for (const [index, slide] of post.slides.entries()) {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Your browser could not create this PDF.");
        const dark = index === 0 || index === post.slides.length - 1;
        ctx.fillStyle = dark ? "#253c32" : "#f6f4ed";
        ctx.fillRect(0, 0, 1080, 1350);
        ctx.fillStyle = dark ? "#e1e9bb" : "#496046";
        ctx.font = "600 24px Arial";
        ctx.fillText(author.toUpperCase().slice(0, 36), 110, 130);
        ctx.fillRect(110, 180, 78, 8);
        ctx.fillStyle = dark ? "#fbfaf5" : "#253c32";
        textBox(ctx, slide.title, 310, 400, 91, true);
        textBox(ctx, slide.body, 800, 350, 48, false);
        ctx.strokeStyle = dark ? "#64745b" : "#c7cdbb";
        ctx.beginPath();
        ctx.moveTo(110, 1220);
        ctx.lineTo(970, 1220);
        ctx.stroke();
        ctx.font = "500 22px Arial";
        ctx.fillText("SIGNAL  /  " + post.pillar.toUpperCase(), 110, 1270);
        ctx.textAlign = "right";
        ctx.fillText(String(index + 1).padStart(2, "0") + " / " + String(post.slides.length).padStart(2, "0"), 970, 1270);
        images.push(Uint8Array.from(atob(canvas.toDataURL("image/jpeg", 0.94).split(",")[1]), c => c.charCodeAt(0)));
    }
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const offsets: number[] = [0];
    let length = 0;
    const append = (value: string | Uint8Array) => {
        const bytes = typeof value === "string" ? encoder.encode(value) : value;
        chunks.push(bytes);
        length += bytes.length;
    };
    const object = (id: number, body: string) => { offsets[id] = length; append(id + " 0 obj\n" + body + "\nendobj\n"); };
    append("%PDF-1.4\n");
    object(1, "<< /Type /Catalog /Pages 2 0 R >>");
    object(2, "<< /Type /Pages /Count " + images.length + " /Kids [" + images.map((_, i) => (3 + i * 3) + " 0 R").join(" ") + "] >>");
    images.forEach((bytes, index) => {
        const id = 3 + index * 3;
        object(id, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 625] /Resources << /XObject << /Image " +
            (id + 1) + " 0 R >> >> /Contents " + (id + 2) + " 0 R >>");
        offsets[id + 1] = length;
        append((id + 1) + " 0 obj\n<< /Type /XObject /Subtype /Image /Width 1080 /Height 1350 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + bytes.length + " >>\nstream\n");
        append(bytes);
        append("\nendstream\nendobj\n");
        const commands = "q 500 0 0 625 0 0 cm /Image Do Q";
        object(id + 2, "<< /Length " + commands.length + " >>\nstream\n" + commands + "\nendstream");
    });
    const xref = length;
    append("xref\n0 " + offsets.length + "\n0000000000 65535 f \n");
    for (const offset of offsets.slice(1))
        append(String(offset).padStart(10, "0") + " 00000 n \n");
    append("trailer\n<< /Size " + offsets.length + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");
    downloadFile(new Blob(chunks as BlobPart[], { type: "application/pdf" }), "signal-carousel.pdf");
}
