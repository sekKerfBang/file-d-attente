#!/bin/bash

# ============================================
# SCRIPT REINSTALLATION INTELLIJ IDEA 2025
# ============================================

VERSION="2025.3.1.1"
BUILD="idea-IU-253.29346.240"
URL="https://download.jetbrains.com/idea/ideaIU-${VERSION}.tar.gz"
INSTALL_DIR="$HOME/Programmes"
DESKTOP_FILE="$HOME/.local/share/applications/intellij-idea.desktop"

echo "🧹 ÉTAPE 1 : Suppression complète..."

# Arrêter IntelliJ
killall -9 java 2>/dev/null
killall -9 idea.sh 2>/dev/null
sleep 2

# Supprimer installation
rm -rf ${INSTALL_DIR}/intellij-idea
rm -rf ${INSTALL_DIR}/${BUILD}
rm -rf ~/Téléchargements/idea-*

# Supprimer configs (TRIAL RESET)
rm -rf ~/.config/JetBrains
rm -rf ~/.cache/JetBrains  
rm -rf ~/.local/share/JetBrains
rm -rf ~/.java/.userPrefs/jetbrains

# Supprimer entrées menu
rm -f ${DESKTOP_FILE}
rm -f ~/Bureau/idea.desktop 2>/dev/null

# Nettoyer historique shell
sed -i '/idea.sh/d' ~/.bashrc 2>/dev/null

echo "✅ Suppression terminée"

# ============================================
echo ""
echo "📥 ÉTAPE 2 : Téléchargement..."

cd ~/Téléchargements
wget -q --show-progress "${URL}" -O idea-${VERSION}.tar.gz

if [ $? -ne 0 ]; then
    echo "❌ Erreur téléchargement"
    exit 1
fi

echo "✅ Téléchargement terminé"

# ============================================
echo ""
echo "📦 ÉTAPE 3 : Installation..."

mkdir -p ${INSTALL_DIR}
tar -xzf idea-${VERSION}.tar.gz -C ${INSTALL_DIR}/

# Renommer pour simplifier
mv ${INSTALL_DIR}/${BUILD} ${INSTALL_DIR}/intellij-idea

# Créer lien symbolique
ln -sf ${INSTALL_DIR}/intellij-idea/bin/idea.sh ~/idea.sh 2>/dev/null

echo "✅ Installation terminée"

# ============================================
echo ""
echo "🚀 ÉTAPE 4 : Création lanceur..."

cat > ${DESKTOP_FILE} << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=IntelliJ IDEA
Icon=${INSTALL_DIR}/intellij-idea/bin/idea.svg
Exec="${INSTALL_DIR}/intellij-idea/bin/idea.sh" %f
Comment=Capable and Ergonomic IDE for JVM
Categories=Development;IDE;
Terminal=false
StartupNotify=true
StartupWMClass=jetbrains-idea
EOF

chmod +x ${DESKTOP_FILE}

# Ajouter alias
echo 'alias idea="${HOME}/Programmes/intellij-idea/bin/idea.sh"' >> ~/.bashrc

echo "✅ Lanceur créé"

# ============================================
echo ""
echo "🎉 TERMINÉ !"

echo ""
echo "📍 Installation : ${INSTALL_DIR}/intellij-idea"
echo "🖥️  Lanceur     : Menu Applications → Développement → IntelliJ IDEA"
echo "⌨️  Commande    : idea (après rechargement terminal)"
echo ""
echo "⚠️  IMPORTANT : Lancez maintenant pour démarrer le trial de 30 jours"
echo ""

# Lancer directement (optionnel)
read -p "Lancer IntelliJ maintenant ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    ${INSTALL_DIR}/intellij-idea/bin/idea.sh &
fi
