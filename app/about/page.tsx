export default function AboutPage() {
  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "calc(var(--header-height) + 60px) 24px 100px",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(24px, 5vw, 40px)",
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: "8px",
        }}
      >
        Curiosity Saves the Cat.
      </h1>
      <h2
        style={{
          fontSize: "clamp(16px, 3vw, 22px)",
          fontWeight: 500,
          lineHeight: 1.4,
          marginBottom: "48px",
          color: "#555",
        }}
      >
        好奇心は、猫を救う。
      </h2>

      <div
        style={{
          fontSize: "clamp(14px, 2vw, 16px)",
          lineHeight: 2,
          color: "#333",
        }}
      >
        <p>
          気になるものは嗅いでみる。物音に耳だけくるりと向ける。隙間があれば前足を差し込む。
          好奇心旺盛な猫と人が暮らしはじめて約9500年。
        </p>

        <p style={{marginTop: "1.5em"}}>
          古くは浮世絵や文学にも好んで描かれ、AIが画像の海から見出した最初の生物も、猫でした。
          猫ミームはインターネットを駆けめぐり、今や空前の猫ブームが訪れています。
        </p>

        <p style={{marginTop: "1.5em"}}>
          笑いも、癒しも。毎日かけがえのないものをくれる猫たちに報いたい。
          そんな想いで結ばれたメンバーが集まり、Neko Lab Tokyoは誕生しました。
        </p>

        <p style={{marginTop: "1.5em"}}>
          これは、好奇心と創造力で猫と人との関係をより良くしていくプロジェクト。
          今度は人間が、猫たちに負けない好奇心を発揮する番です。
        </p>
      </div>
    </main>
  );
}
