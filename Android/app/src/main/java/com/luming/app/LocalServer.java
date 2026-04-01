package com.luming.app;

import android.content.res.AssetManager;
import fi.iki.elonen.NanoHTTPD;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

public class LocalServer extends NanoHTTPD {
    private final AssetManager assetManager;

    public LocalServer(int port, AssetManager assets) throws IOException {
        super(port);
        this.assetManager = assets;
    }

    @Override
    public Response serve(IHTTPSession session) {
        String uri = session.getUri();
        
        if (uri.equals("/") || uri.isEmpty()) {
            uri = "/首页排盘/index.html";
        }
        
        String assetPath = "web" + uri;
        if (assetPath.startsWith("/")) {
            assetPath = assetPath.substring(1);
        }
        
        try {
            assetPath = URLDecoder.decode(assetPath, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        
        try {
            InputStream inputStream = assetManager.open(assetPath);
            byte[] content = readAllBytes(inputStream);
            String mimeType = getMimeType(assetPath);
            return newChunkedResponse(Response.Status.OK, mimeType, 
                new java.io.ByteArrayInputStream(content));
        } catch (IOException e) {
            String errorMsg = "File not found: " + assetPath;
            return newChunkedResponse(Response.Status.NOT_FOUND, "text/plain", 
                new java.io.ByteArrayInputStream(errorMsg.getBytes()));
        }
    }

    private byte[] readAllBytes(InputStream inputStream) throws IOException {
        java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[4096];
        while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        buffer.flush();
        return buffer.toByteArray();
    }

    private String getMimeType(String path) {
        if (path.endsWith(".html") || path.endsWith(".htm")) {
            return "text/html";
        } else if (path.endsWith(".js")) {
            return "application/javascript";
        } else if (path.endsWith(".css")) {
            return "text/css";
        } else if (path.endsWith(".png")) {
            return "image/png";
        } else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (path.endsWith(".gif")) {
            return "image/gif";
        } else if (path.endsWith(".svg")) {
            return "image/svg+xml";
        } else if (path.endsWith(".json")) {
            return "application/json";
        } else if (path.endsWith(".xml")) {
            return "application/xml";
        } else if (path.endsWith(".woff")) {
            return "font/woff";
        } else if (path.endsWith(".woff2")) {
            return "font/woff2";
        } else if (path.endsWith(".ttf")) {
            return "font/ttf";
        } else if (path.endsWith(".mjs")) {
            return "application/javascript";
        } else if (path.endsWith(".epub")) {
            return "application/epub+zip";
        } else if (path.endsWith(".wasm")) {
            return "application/wasm";
        }
        return "application/octet-stream";
    }
}