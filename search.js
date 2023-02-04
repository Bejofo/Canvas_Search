import pdfUtil from "https://esm.sh/pdf-to-text@0.0.7";
import { includesNeedle } from "https://deno.land/std@0.176.0/bytes/includes_needle.ts";

async function searchFile(filePath,keywords) {
    // console.log(filePath);

    const blacklist = [".exe",".png",".jpeg"];
    for(let e in blacklist){
        if(filePath.endsWith(e)){
            return false;
        }
    }

    if (filePath.endsWith(".pdf")) {
        try {
            const data = await pdfToTextAsync(filePath);
            return data.includes(keywords);
        } catch(e)
        {
            console.error(e);
            return false;
        }
    } else {
        const data = Deno.readFileSync(filePath);
        const encoder = new TextEncoder()
        const buffer = encoder.encode(keywords);
        const needle = new Uint8Array(buffer);
        // console.log(needle);
        return includesNeedle(data,needle);
    }
}

function pdfToTextAsync(fileName) {
    return new Promise(function (resolve, reject) {
        pdfUtil.pdfToText(fileName, null, function (err, data) {
            if (err) reject(err);
            resolve(data)
        });
    });
}

export {searchFile};