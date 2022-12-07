async function instantiate(duckdb) {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker = await duckdb.createWorker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return db;
}

async function kissThenQuery(db) {
    const conn = await db.connect();
    await conn.query(`CREATE TABLE kiss AS (
        SELECT 1 AS id, 'Keep' AS text UNION ALL
        SELECT 2 AS id, 'It' AS text UNION ALL
        SELECT 3 AS id, 'SQL' AS text UNION ALL
        SELECT 4 AS id, 'S... Quack!' AS text
    );`);
    return conn;
}

async function renderTable(dbConn, editorQuery, res) {
    let fetchQuery = await dbConn.query(editorQuery).catch((e) => {
        document.getElementById(res).innerHTML = `<p style="color:darkred;">` + e + `</p>`;
    });
    if (fetchQuery) {
        document.getElementById(res).innerHTML = "";
        if (editorQuery.split(" ")[0].toLowerCase() != "explain") {
            document.getElementById(res).appendChild(Inputs.table(fetchQuery));
        } else {
            let explainValue = fetchQuery.get(0).explain_value
            document.getElementById(res).innerHTML = `<pre style="background-color: #ffffff">${explainValue}</pre>`;
        }
    }
}
