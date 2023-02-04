
//https://github.com/mfine15/csync/
import { opine } from "https://deno.land/x/opine@2.3.3/mod.ts";
import {searchFile} from "./search.js"
// import { ensureDir, pathExists} from "npm:fs-extra";
// import { Buffer } from "https://deno.land/std/io/mod.ts";

import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import files from 'https://deno.land/x/read_files@v0.1.0/mod.ts'


const app = opine();

app.get("/", function (req, res) {
    res.sendFile("index.html", { root: '.' })
});

app.get("/s", async function (req, res) {
    var results = [];
    const keywords = req.query.s;
    for await (const file of files('./files')) {
        if (await searchFile(file,keywords)) {
            results.push(file);
        }
    }
    res.send(results);
});


app.get("/search", function (req, res) {
    res.sendFile("index.html", { root: '.' })
});

app.listen(3000, () =>
    console.log("server has started on http://localhost:3000 🚀")
);


async function r(url, isJson = true) {
    var x = await fetch(url, {
        method: "get",
        headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`
        },
    });
    if (isJson) {
        return await x.json();
    }
    return await x.blob();
}

async function syncCourse(courseId) {
    const dest = `./files/${courseId}/`;
    let folderPaths = {};
    const folders = await r(`${CANVAS_API}courses/${courseId}/folders?per_page=100`);
    for (let folder of folders) {
        const path = dest + folder.full_name
        folderPaths[folder.id] = folder.full_name;
        try {
            await ensureDir(path.toString());
        } catch (e) {
            throw e;
        }
    }
    const files = await r(`${CANVAS_API}courses/${courseId}/files?per_page=100`);
    for (let file of files) {
        // console.log(file);
        // console.log(file.folder_id);
        const fPath =
            dest + "/" + folderPaths[file.folder_id] + "/" + file.display_name;
        const _exists = await exists(fPath);
        const remoteModified = Date.parse(file.updated_at);

        if (!_exists) {
            downloadFile(file, fPath);
        } else {
            const stats = await Deno.stat(fPath);
            if (remoteModified > stats.mtime.getTime()) {
                downloadFile(file, fPath);
            }
        }
    }
}

async function downloadFile(file, path) {
    // winston.info("File %s out of date, updating", file.display_name);
    // console.log(file);
    const blob = await r(`${file.url}`, false);
    // console.log(blob);
    Deno.writeFileSync(path, await blob.arrayBuffer());
    //https://github.com/denoland/deno/issues/5626
}

const config = JSON.parse(await Deno.readTextFile("./config.json"));
const {ACCESS_TOKEN,CANVAS_API,COURSE_IDS} = config;
for(let i of COURSE_IDS){
    syncCourse(i);
}