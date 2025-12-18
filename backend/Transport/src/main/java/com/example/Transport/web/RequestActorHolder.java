// src/main/java/com/example/Transport/web/RequestActorHolder.java
package com.example.Transport.web;

import org.springframework.stereotype.Component;

@Component
public class RequestActorHolder {
    private static final ThreadLocal<String> TL = new ThreadLocal<>();

    public void set(String actor) { TL.set(actor); }

    public String get() {
        String a = TL.get();
        return (a == null || a.isBlank()) ? "system" : a;
    }

    public void clear() { TL.remove(); }
}
