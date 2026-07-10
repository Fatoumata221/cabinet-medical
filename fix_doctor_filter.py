path = "src/lib/services.js"

with open(path, "rb") as f:
    content = f.read().decode("utf-8")

old = "appointments = appointments.filter(apt => apt.medecin_id === doctorId);"
new = "appointments = appointments.filter(apt => Number(apt.medecin_id) === Number(doctorId));"

if old not in content:
    print("⚠️ Bloc non trouvé, vérifie manuellement.")
else:
    content = content.replace(old, new)
    with open(path, "wb") as f:
        f.write(content.encode("utf-8"))
    print("✅ Comparaison corrigée avec succès.")
