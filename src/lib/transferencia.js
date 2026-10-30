export function offerDownload(filename, data, notify) {
  try {
    const type = filename.endsWith(".json") ? "application/json" : "text/csv;charset=utf-8";
    const url = URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`Ficheiro ${filename} transferido.`);
  } catch (e) {
    notify("Não foi possível transferir o ficheiro.");
  }
}
