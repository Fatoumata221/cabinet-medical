path = "src/utils/waitingQueueStatus.js"

with open(path, "rb") as f:
    content = f.read().decode("utf-8")

marker = "export const hasPastAppointment = (queueItem, now = new Date()) => {"

if marker not in content:
    print("Marqueur introuvable, affichage du debut du fichier pour verification:")
    print(content[:200])
else:
    insertion = (
        marker + "\n"
        "  if (\n"
        "    isPresentInQueueStatus(queueItem?.status) ||\n"
        "    isCalledInQueueStatus(queueItem?.status) ||\n"
        "    isInConsultationQueueStatus(queueItem?.status)\n"
        "  ) {\n"
        "    return false;\n"
        "  }"
    )
    content = content.replace(marker, insertion, 1)
    with open(path, "wb") as f:
        f.write(content.encode("utf-8"))
    print("Correctif applique avec succes.")
