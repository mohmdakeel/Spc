package com.example.Transport.history;

import com.example.Transport.history.dto.ChangeItem;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;

import java.math.BigDecimal;
import java.util.*;

/**
 * Compares two JSON structures (from String or POJO) and emits a list of ChangeItem entries.
 * - Detects ADDED / REMOVED / CHANGED / TYPE_CHANGED
 * - Traverses objects and arrays, producing dot-and-index paths (e.g., "user.addresses[0].city")
 * Also provides a minimal toJson(...) helper so callers don't need a separate JsonUtil.
 */
public class JsonDiff {

    public static final String TYPE_ADDED       = "ADDED";
    public static final String TYPE_REMOVED     = "REMOVED";
    public static final String TYPE_CHANGED     = "CHANGED";
    public static final String TYPE_TYPECHANGED = "TYPE_CHANGED";
    public static final String TYPE_ERROR       = "ERROR";

    // Lightweight shared mapper for toJson() (kept compact; no pretty-print)
    private static final ObjectMapper DEFAULT_MAPPER = new ObjectMapper();

    /* -------------------- PUBLIC API: DIFF -------------------- */

    /** Diff: previous JSON string vs current POJO (converted with the provided mapper). */
    public static List<ChangeItem> diff(ObjectMapper mapper, String prevJson, Object currentObj) {
        try {
            JsonNode prev = (prevJson == null || prevJson.isBlank())
                    ? mapper.nullNode()
                    : mapper.readTree(prevJson);
            JsonNode curr = mapper.valueToTree(currentObj);
            List<ChangeItem> out = new ArrayList<>();
            walk("", prev, curr, out);
            return out;
        } catch (Exception e) {
            return List.of(ChangeItem.builder()
                    .field("$error")
                    .beforeVal(prevJson)
                    .afterVal("DIFF_FAILED: " + e.getMessage())
                    .changeType(TYPE_ERROR)
                    .build());
        }
    }

    /** Diff: previous JSON string vs next JSON string. */
    public static List<ChangeItem> diff(ObjectMapper mapper, String prevJson, String nextJson) {
        try {
            JsonNode prev = (prevJson == null || prevJson.isBlank())
                    ? mapper.nullNode()
                    : mapper.readTree(prevJson);
            JsonNode next = (nextJson == null || nextJson.isBlank())
                    ? mapper.nullNode()
                    : mapper.readTree(nextJson);
            List<ChangeItem> out = new ArrayList<>();
            walk("", prev, next, out);
            return out;
        } catch (Exception e) {
            return List.of(ChangeItem.builder()
                    .field("$error")
                    .beforeVal(prevJson)
                    .afterVal("DIFF_FAILED: " + e.getMessage())
                    .changeType(TYPE_ERROR)
                    .build());
        }
    }

    /* -------------------- PUBLIC API: JSON HELPER -------------------- */

    /**
     * Minimal JSON serializer so callers don't need a separate JsonUtil.
     * Returns null for null input.
     */
    public static String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return DEFAULT_MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON serialization failed", e);
        }
    }

    /* -------------------- INTERNALS -------------------- */

    private static void walk(String path, JsonNode a, JsonNode b, List<ChangeItem> out) {
        if (a == null) a = JsonNodeFactory.instance.nullNode();
        if (b == null) b = JsonNodeFactory.instance.nullNode();

        // If node types differ, record TYPE_CHANGED and stop descending here
        if (a.getNodeType() != b.getNodeType()) {
            out.add(ChangeItem.builder()
                    .field(path)
                    .beforeVal(nodeVal(a))
                    .afterVal(nodeVal(b))
                    .changeType(TYPE_TYPECHANGED)
                    .build());
            return;
        }

        if (a.isObject() && b.isObject()) {
            Set<String> fields = new TreeSet<>();
            a.fieldNames().forEachRemaining(fields::add);
            b.fieldNames().forEachRemaining(fields::add);
            for (String f : fields) {
                String p = path.isEmpty() ? f : path + "." + f;
                walk(p, a.get(f), b.get(f), out);
            }
            return;
        }

        if (a.isArray() && b.isArray()) {
            int max = Math.max(a.size(), b.size());
            for (int i = 0; i < max; i++) {
                String p = path + "[" + i + "]";
                JsonNode ai = a.size() > i ? a.get(i) : JsonNodeFactory.instance.nullNode();
                JsonNode bi = b.size() > i ? b.get(i) : JsonNodeFactory.instance.nullNode();
                walk(p, ai, bi, out);
            }
            return;
        }

        Object va = nodeVal(a);
        Object vb = nodeVal(b);

        if (!safeEquals(va, vb)) {
            String changeType = (va == null && vb != null)
                    ? TYPE_ADDED
                    : ((vb == null && va != null) ? TYPE_REMOVED : TYPE_CHANGED);

            out.add(ChangeItem.builder()
                    .field(path)
                    .beforeVal(va)
                    .afterVal(vb)
                    .changeType(changeType)
                    .build());
        }
    }

    private static Object nodeVal(JsonNode n) {
        if (n == null || n.isNull()) return null;
        if (n.isNumber()) {
            try {
                return new BigDecimal(n.asText());
            } catch (NumberFormatException ex) {
                return new BigDecimal(n.numberValue().toString());
            }
        }
        if (n.isBoolean()) return n.booleanValue();
        if (n.isTextual()) return n.textValue();
        return n.toString();
    }

    private static boolean safeEquals(Object a, Object b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if (a instanceof BigDecimal && b instanceof BigDecimal) {
            return ((BigDecimal) a).compareTo((BigDecimal) b) == 0;
        }
        return Objects.equals(a, b);
    }
}
