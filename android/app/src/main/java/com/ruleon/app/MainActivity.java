package com.ruleon.app;

import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        disableWebViewAssistExtraction();
    }

    private void disableWebViewAssistExtraction() {
        if (getBridge() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }
        webView.post(() -> {
            webView.setImportantForAutofill(
                View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS
            );
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                webView.setImportantForContentCapture(
                    View.IMPORTANT_FOR_CONTENT_CAPTURE_NO
                );
            }
        });
    }
}
