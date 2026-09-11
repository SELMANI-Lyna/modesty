# Guide de construction — Boutique en ligne (A à Z)

## 1. Stack technique (et pourquoi)

| Techno | Rôle | Pourquoi celle-là |
|---|---|---|
| **Next.js** (React) | Frontend + Backend (API routes) dans un seul projet | Un seul framework gère les pages ET les endpoints API. Standard pro, gratuit sur Vercel. |
| **Tailwind CSS** | Styling | Rapide à écrire, pas besoin de fichiers CSS séparés partout. |
| **PostgreSQL** | Base de données | Fiable, gratuit sur Neon.tech ou Supabase, gère bien les relations (produits ↔ commandes). |
| **Prisma** | ORM (parle à la base de données) | Empêche les injections SQL automatiquement, écriture de requêtes plus simple et plus sûre. |
| **NextAuth.js** | Authentification admin | Gère les sessions, cookies sécurisés (httpOnly), évite de coder l'auth toi-même. |
| **Cloudinary** | Stockage d'images | Upload direct, redimensionnement auto, gratuit jusqu'à un certain volume. |
| **Resend** (ou Nodemailer) | Notifications email | Envoie un email à l'admin à chaque nouvelle commande. |
| **Vercel** | Hébergement | Gratuit, déploiement automatique à chaque `git push`, HTTPS inclus. |

Langage : commence en **JavaScript** (plus simple). Tu pourras migrer vers **TypeScript** plus tard si tu veux plus de rigueur (bon réflexe vu ton profil cybersécu, mais pas obligatoire pour la v1).

---

## 2. Architecture des dossiers

```
shop-project/
├── app/
│   ├── page.jsx                    → page d'accueil
│   ├── layout.jsx                  → layout global (navbar, footer)
│   ├── globals.css
│   ├── products/
│   │   ├── page.jsx                → tous les produits + filtres
│   │   └── [id]/page.jsx           → page d'un seul produit
│   ├── panier/page.jsx             → panier
│   ├── commande/page.jsx           → formulaire de commande
│   ├── about/page.jsx              → à propos
│   ├── admin/
│   │   ├── layout.jsx              → vérifie que l'utilisateur est connecté
│   │   ├── page.jsx                → dashboard (vue d'ensemble)
│   │   ├── login/page.jsx
│   │   ├── products/
│   │   │   ├── page.jsx            → liste + gestion produits
│   │   │   └── new/page.jsx        → ajouter un produit
│   │   ├── orders/page.jsx         → gestion commandes
│   │   └── feedback/page.jsx       → gestion avis clients
│   └── api/
│       ├── auth/[...nextauth]/route.js
│       ├── products/route.js       → GET (liste) / POST (créer)
│       ├── products/[id]/route.js  → GET / PUT / DELETE un produit
│       ├── orders/route.js         → GET (liste) / POST (nouvelle commande)
│       ├── feedback/route.js
│       └── upload/route.js         → upload image vers Cloudinary
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── ProductCard.jsx
│   ├── CartItem.jsx
│   ├── WilayaSelect.jsx            → dropdown wilaya + commune
│   └── AdminSidebar.jsx
├── lib/
│   ├── prisma.js                   → connexion Prisma (singleton)
│   ├── auth.js                     → config NextAuth
│   └── cloudinary.js
├── prisma/
│   └── schema.prisma               → schéma de la base de données
├── context/
│   └── CartContext.jsx             → état du panier (React Context)
├── public/
│   └── data/wilayas.json           → liste des 58 wilayas + communes
├── .env.local                      → secrets (jamais sur GitHub)
├── package.json
├── tailwind.config.js
└── next.config.js
```

---

## 3. Architecture de la base de données (Prisma schema)

```prisma
model Product {
  id           String      @id @default(cuid())
  name         String
  description  String?
  price        Float
  salePrice    Float?
  category     String      // "jupe", "robe", "ensemble", etc.
  images       String[]    // photos du produit (Cloudinary URLs)
  isBestseller Boolean     @default(false)
  isOnSale     Boolean     @default(false)
  // Pas de champ isSoldOut ici : c'est calculé automatiquement à partir
  // des quantités des variants (voir section "Logique sold-out" plus bas)
  createdAt    DateTime    @default(now())
  colors       Color[]
  variants     Variant[]
  collections  Collection[]
}

model Color {
  id        String  @id @default(cuid())
  name      String  // nom tapé par l'admin, ex: "Rouge Bordeaux"
  hex       String  // code hex choisi dans la palette, ex: "#7B1E3A"
  product   Product @relation(fields: [productId], references: [id])
  productId String
}

model Variant {
  id           String      @id @default(cuid())
  size         String      // ex: "S", "M", "L" ou "38", "40"
  colorName    String      // ex: "pink"
  colorHex     String      // ex: "#e91e8c" — choisi dans le color picker
  image        String?     // photo spécifique à cette variante (optionnel, sinon on retombe sur les images du produit)
  price        Float?      // override optionnel — sinon on utilise Product.price
  reducedPrice Float?      // override optionnel — sinon on utilise Product.salePrice
  quantity     Int         @default(0)
  sku          String?     // optionnel — juste un repère pour l'admin, pas utilisé par le code
  isActive     Boolean     @default(true) // le toggle "Status" — variante visible/vendable ou désactivée
  product      Product     @relation(fields: [productId], references: [id])
  productId    String
  orderItems   OrderItem[]

  @@unique([productId, sku]) // deux produits différents peuvent chacun avoir un SKU "M-PK", mais pas le même produit deux fois
}

model Order {
  id                String      @id @default(cuid())
  clientName        String
  phone             String
  wilaya            String
  commune           String
  deliveryType      String      // "home" ou "agency"
  status            String      @default("pending") // pending, confirmed, shipped, delivered, returned, cancelled
  totalPrice        Float
  trackingNumber    String?     // renvoyé par dzship à la création du colis (peu importe le transporteur réel derrière)
  courierSlug       String?     // ex: "dhd", "conexlog" — utile pour savoir quel transporteur a géré ce colis
  courierRawStatus  String?     // statut brut reçu du webhook (utile pour debug, en plus de "status" ci-dessus)
  items             OrderItem[]
  createdAt         DateTime    @default(now())
}

model OrderItem {
  id           String   @id @default(cuid())
  order        Order    @relation(fields: [orderId], references: [id])
  orderId      String
  variant      Variant  @relation(fields: [variantId], references: [id])
  variantId    String
  quantity     Int
  priceAtOrder Float
}

model Feedback {
  id         String   @id @default(cuid())
  clientName String
  message    String
  rating     Int?
  photos     String[] // plusieurs images possibles par avis
  approved   Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model Collection {
  id        String    @id @default(cuid())
  name      String
  image     String?
  status    String    @default("not_in_store") // "in_store" | "not_in_store"
  products  Product[] // relation many-to-many implicite avec Product
  createdAt DateTime  @default(now())
}

model Admin {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
}
```

**Logique clé :** `isBestseller` et `isOnSale` restent des flags manuels (l'admin décide). `isSoldOut` est calculé (section 5). `approved` sur `Feedback` = l'avis n'apparaît sur le site que si l'admin l'a validé. `status` sur `Collection` reflète le toggle "In Store / Not In Store" de tes captures.

**Changement important :** `OrderItem` référence maintenant `variantId` directement (pas `productId` + `size` + `color` séparés) — plus propre, et c'est ce qui permet de savoir exactement quelle variante a été commandée.

---

## 4. Par où commencer — ordre de construction

1. **Setup du projet**
   `npx create-next-app@latest shop-project` → choisis Tailwind CSS = oui, App Router = oui.

2. **Base de données**
   Crée un compte gratuit sur [neon.tech](https://neon.tech) ou [supabase.com](https://supabase.com), récupère l'URL de connexion, mets-la dans `.env.local`.

3. **Prisma**
   `npm install prisma @prisma/client` → `npx prisma init` → colle le schéma ci-dessus dans `prisma/schema.prisma` → `npx prisma migrate dev`.

4. **Auth admin**
   Installe NextAuth, crée un compte admin (email + mot de passe hashé avec bcrypt), configure `lib/auth.js`.

5. **CRUD produits (API + admin)**
   Construis d'abord `api/products/route.js` (créer/lister), puis la page admin pour ajouter un produit avec upload d'image Cloudinary. Teste que tu peux ajouter un produit avant de construire la vitrine.

6. **Page d'accueil + page produit (côté client)**
   Une fois que tu as des produits en base, construis la grille filtrable, la section bestsellers, la page produit avec galerie/tailles/couleurs.

7. **Panier + formulaire de commande**
   Context React pour le panier, puis le formulaire avec dropdown wilaya → commune (le JSON dans `public/data/wilayas.json`), choix domicile/agence.

8. **Dashboard admin complet**
   Liste des commandes avec changement de statut, notification email à l'admin à chaque nouvelle commande, gestion des avis, toggle "en promo".

9. **Déploiement**
   Push sur GitHub → connecte le repo à Vercel → ajoute les variables d'environnement (`.env.local`) dans les settings Vercel → déployé automatiquement.

10. **Domaine personnalisé**
    Une fois que tout marche, connecte ton `.com` (voir l'étape qu'on a déjà couverte).

---

## 5. Logique "sold out" (calculée, pas stockée)

Avec le vrai stock par variant, le sold-out se calcule à 3 niveaux, jamais en dur en base :

```js
// Exemple : donné un produit avec ses variants inclus (Prisma include: { variants: true })

// 1. Une combinaison précise (ex: Rose + M) est en rupture
const isVariantSoldOut = (variants, color, size) => {
  const v = variants.find(v => v.colorName === color && v.size === size);
  return !v || v.quantity === 0;
};

// 2. Une couleur entière est en rupture (toutes ses tailles à 0)
const isColorSoldOut = (variants, color) => {
  return variants
    .filter(v => v.colorName === color)
    .every(v => v.quantity === 0);
};

// 3. Le produit entier est en rupture (badge affiché sur la home)
const isProductSoldOut = (variants) => {
  return variants.every(v => v.quantity === 0);
};
```

**Où l'utiliser :**
- Sur la page produit, quand tu affiches les pastilles de couleur : si `isColorSoldOut(variants, color)` est vrai → affiche le swatch avec une barre diagonale (CSS `background: linear-gradient` ou juste une image overlay) et désactive le clic dessus.
- Une fois une couleur sélectionnée, applique la même logique aux boutons de taille avec `isVariantSoldOut`.
- Sur la home/grille produits, calcule `isProductSoldOut` pour chaque produit et affiche le badge "ÉPUISÉ" dessus.

Exemple visuel pour le swatch barré (CSS) :
```css
.swatch-sold-out {
  position: relative;
  opacity: 0.4;
  pointer-events: none; /* non cliquable */
}
.swatch-sold-out::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to top right, transparent 47%, currentColor 48%, currentColor 52%, transparent 53%);
}
```

**Note :** filtre toujours sur `variants.filter(v => v.isActive)` d'abord — `isActive` (le toggle "Status" de l'admin) est différent de la quantité à 0. `isActive = false` = l'admin a désactivé cette variante à la main (couleur arrêtée, par ex.), alors qu'une quantité à 0 = rupture de stock auto-détectée. Une variante désactivée ne devrait même pas apparaître comme swatch, alors qu'une variante en rupture apparaît mais barrée.

---

## 6. Le "Variant Builder" (page admin, comme sur Ayor)

C'est la partie la plus technique du panneau admin. Voici la logique exacte :

**Structure de l'état (React) :**
```js
const [options, setOptions] = useState([
  { name: "Size", style: "text", values: ["S", "M", "L", "XL"] },
  { name: "Color", style: "color", values: [{ name: "pink", hex: "#e91e8c" }, { name: "blue", hex: "#3b5bdb" }] },
]);
const [variants, setVariants] = useState([]); // généré automatiquement
```

**Étape 1 — Chaque ligne d'option :**
Un input "Option Name" (ex: "Size"), un select "Option Style" (Text ou Color), et un champ "Option Values" en chips : chaque valeur tapée + Entrée devient une pastille avec un ✕ pour la supprimer, plus un input "Type..." pour en ajouter une nouvelle. Si le style est "Color", ajouter une valeur ouvre en plus un color picker (comme sur ta capture) pour lui associer un hex.

**Étape 2 — Génération du produit cartésien :**
Dès que 2 options existent, calcule toutes les combinaisons possibles :
```js
function generateVariants(options) {
  const [sizeOpt, colorOpt] = options; // adapte si l'ordre change
  const combos = [];
  for (const size of sizeOpt.values) {
    for (const color of colorOpt.values) {
      combos.push({
        size,
        colorName: color.name,
        colorHex: color.hex,
        sku: "",
        quantity: 0,
        price: null,
        reducedPrice: null,
        isActive: true,
        image: null,
      });
    }
  }
  return combos;
}
```
Appelle cette fonction à chaque changement des `values` (ajout/suppression d'une taille ou couleur) et régénère `variants` — mais **en conservant les valeurs déjà saisies** pour les combos qui existaient déjà (ne pas écraser un SKU/quantité déjà rempli juste parce qu'on a ajouté une nouvelle taille ailleurs). Pour ça, fusionne par clé `size-colorName` :
```js
function mergeVariants(oldVariants, newCombos) {
  return newCombos.map(combo => {
    const existing = oldVariants.find(v => v.size === combo.size && v.colorName === combo.colorName);
    return existing || combo; // garde l'existant, sinon prends le nouveau vide
  });
}
```

**Étape 3 — Le tableau généré :**
Une ligne par variante, avec : toggle Status (`isActive`), petit slot photo cliquable (upload → Cloudinary → `image`), Price, Reduced Price, Quantity, SKU. Le nom de la variante ("M-pink") est juste `${size}-${colorName}` affiché en lecture seule.

**Étape 4 — Sauvegarde :**
Un seul submit envoie le produit + son tableau `variants[]` complet à ton API, qui crée le `Product` puis boucle pour créer chaque `Variant` lié.

---

## 7. Mise à jour du stock — uniquement manuelle par l'admin

Placer une commande **ne touche jamais** à `Variant.quantity`. La création de commande se contente d'enregistrer les `OrderItem` (produit, taille, couleur, quantité commandée) — aucun décrément automatique.

```js
// app/api/orders/route.js — ne touche PAS au stock
export async function POST(req) {
  const { items, ...orderData } = await req.json();
  // items = [{ variantId, quantity, priceAtOrder }, ...]

  const order = await prisma.order.create({
    data: {
      ...orderData,
      items: { create: items },
    },
  });

  return Response.json(order);
}
```

**Le seul endroit où `quantity` change**, c'est quand l'admin ouvre la page d'édition du produit (le même tableau size × color du Variant Builder, section 6) et modifie le chiffre à la main — que ce soit pour refléter une vente, un réassort, ou corriger une erreur.

```js
// app/api/admin/variants/[id]/route.js
export async function PUT(req, { params }) {
  const { quantity } = await req.json();
  const updated = await prisma.variant.update({
    where: { id: params.id },
    data: { quantity },
  });
  return Response.json(updated);
}
```

Simple, direct, zéro logique cachée : la liste des commandes te dit ce qui a été commandé, et c'est toi (ou l'admin) qui décide quand et de combien ajuster le stock réel — utile aussi si un client annule, tu ne dois rien "réajouter", tu n'as jamais rien retiré.

---

## 8. Collections (comme tes captures)

Formulaire "Add Collection" : nom, image optionnelle, statut (In Store / Not In Store), multi-select pour choisir les produits inclus. `Collection` et `Product` sont en relation many-to-many : un produit peut appartenir à plusieurs collections en même temps (ex: une jupe dans "Été 2026" ET dans "Meilleures ventes").

```js
await prisma.collection.create({
  data: {
    name: "Été 2026",
    status: "in_store",
    products: { connect: [{ id: productId1 }, { id: productId2 }] },
  },
});
```

---

## 10. Livraison — intégration via dzship (couvre Ecotrack + autres)

**Important :** Ecotrack n'est pas UNE entreprise, c'est un moteur d'API partagé par ~30 transporteurs algériens différents (DHD, Conexlog, MSM Go, Golivri, etc.), chacun avec sa propre URL et son propre token. Plutôt que d'intégrer le transporteur précis à la main, on passe par **dzship** (dzbuild.com) : une API unifiée gratuite qui couvre les transporteurs Ecotrack ET d'autres (Yalidine, ZR Express, Maystro, NOEST). Résultat : un seul format de requête, peu importe le transporteur réel derrière — tu changes juste un "slug" si jamais la cliente change de transporteur un jour.

**Ce qu'il te faut :** le slug du transporteur exact de la cliente (ex: "dhd", "conexlog", "golivri" — la liste est sur dzbuild.com/docs/couriers) + le token API qu'elle génère depuis SON dashboard transporteur (jamais son mot de passe).

```
DZSHIP_COURIER_SLUG=dhd
DZSHIP_API_TOKEN=le-token-fourni-par-la-cliente
```

*(Vérifie la doc exacte de dzbuild.com au moment de coder — l'URL de base et la forme exacte des requêtes pourraient différer légèrement de ce qui suit, à confirmer une fois que tu as le vrai token en main.)*

**A. Créer un colis (quand l'admin confirme une commande) :**
```js
async function createShipment(order) {
  const res = await fetch(`https://api.dzbuild.com/v1/shipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DZSHIP_API_TOKEN}`,
    },
    body: JSON.stringify({
      courier: process.env.DZSHIP_COURIER_SLUG,
      client_name: order.clientName,
      phone: order.phone,
      wilaya: order.wilaya,
      commune: order.commune,
      delivery_type: order.deliveryType, // "home" ou "agency"
      amount: order.totalPrice, // montant à encaisser (COD)
    }),
  });
  const data = await res.json();
  await prisma.order.update({
    where: { id: order.id },
    data: { trackingNumber: data.tracking_number, courierSlug: process.env.DZSHIP_COURIER_SLUG, status: "shipped" },
  });
}
```

**B. Recevoir les mises à jour de statut (webhook) :**
```js
// app/api/webhooks/dzship/route.js
export async function POST(req) {
  const payload = await req.json();
  // Vérifie une signature/secret fourni par dzship, pour être sûr que ça vient bien d'eux

  const order = await prisma.order.findFirst({ where: { trackingNumber: payload.tracking_number } });
  if (!order) return Response.json({ ok: false }, { status: 404 });

  const isReturned = payload.status?.toLowerCase().includes("retour");
  const mappedStatus = isReturned ? "returned" : mapCourierStatus(payload.status); // écris ta propre fonction de mapping — dzship normalise déjà pas mal, mais vérifie ses valeurs exactes

  await prisma.order.update({
    where: { id: order.id },
    data: { status: mappedStatus, courierRawStatus: payload.status },
  });

  if (isReturned) {
    await sendReturnEmail(order); // via Resend, voir ci-dessous
  }

  return Response.json({ ok: true });
}
```

**C. Envoyer l'email (Resend) :**
```js
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendReturnEmail(order) {
  await resend.emails.send({
    from: "notifications@tondomaine.com",
    to: "email-de-l-admin@example.com",
    subject: `Colis retourné — commande ${order.id}`,
    html: `<p>La commande de ${order.clientName} (${order.phone}) a été retournée par le transporteur.</p>`,
  });
}
```

**D. Sur la charge (600+ commandes/jour) — pas un problème avec cette stack**, mais un point de config à ne pas oublier : utilise l'**URL de connexion "pooled"** de Neon (pas l'URL directe) dans `DATABASE_URL`. Sans ça, les fonctions serverless de Vercel peuvent ouvrir trop de connexions simultanées à la base et provoquer des erreurs bien avant d'atteindre un vrai volume élevé. Neon te donne les deux URLs dans son dashboard — prends celle marquée "pooled connection".

---

## 11. Analytics — ce qui est réaliste pour la v1

Facile, tu as déjà les données :
- **Orders** → `prisma.order.count()`
- **Sales Revenue** → `prisma.order.aggregate({ _sum: { totalPrice: true } })`
- **Best Selling Products** → group by sur `OrderItem` par produit/variante, trié par quantité vendue

Plus dur, demande un système à part (pas de données actuellement) :
- **Total Traffic** et **Top Converting Landing Pages** → nécessitent de tracker chaque visite, ce qui n'existe pas encore. Faisable plus tard avec Vercel Analytics si besoin.
- **Best Selling Bundles** → détecter des produits achetés ensemble, trop avancé pour une v1.

---

## Résumé de la logique générale
Le site public **ne fait que lire** la base de données (via les API routes). L'admin, une fois connecté, est le seul à pouvoir **écrire** dedans (ajouter/modifier/supprimer). Tout — site public et panneau admin — tourne sur le même projet, le même hébergement, la différence est uniquement l'authentification qui protège les routes `/admin/*`.
