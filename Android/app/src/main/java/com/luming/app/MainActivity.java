package com.luming.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private LocalServer localServer;
    private Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        TextView statusText = findViewById(R.id.status);
        WebView webView = findViewById(R.id.webview);

        try {
            localServer = new LocalServer(8080, getAssets());
            localServer.start();
            statusText.setText("Server started on port 8080");

            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setDatabaseEnabled(true);

            handler.postDelayed(() -> {
                webView.loadUrl("http://localhost:8080/首页排盘/index.html");
                statusText.setText("Loading content...");
            }, 500);

        } catch (Exception e) {
            statusText.setText("Server error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (localServer != null) {
            localServer.stop();
        }
    }
}