path = "src/utils/waitingQueueStatus.js"

with open(path, "rb") as f:
    content = f.read().decode("utf-8")

old = """  if (
    isPresentInQueueStatus(queueItem?.status) ||
    isCalledInQueueStatus(queueItem?.status) ||
    isInConsultationQueueStatus(queueItem?.status)
  ) {
    return false;
  }"""

new = """  // Une ligne presente dans waiting_queue signifie que le patient est
  // deja arrive physiquement. Le nettoyage "non honore" ne doit donc
  // jamais s'appliquer ici, quel que soit le statut actif en cours
  // (waiting, called, present, in_consultation, etc.).
  if (isActiveQueueStatus(queueItem?.status)) {
    return false;
  }"""

if old not in content:
    print("Bloc non trouve, verifie manuellement.")
else:
    content = content.replace(old, new)
    with open(path, "wb") as f:
        f.write(content.encode("utf-8"))
    print("Correctif applique avec succes.")
