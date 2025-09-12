package com.example.Transport.history;

import com.example.Transport.history.dto.ChangeItem;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;

import java.util.*;

public class JsonDiff {

    public static List<ChangeItem> diff(ObjectMapper mapper, String prevJson, Object currentObj) {
        try {
            JsonNode prev = (prevJson == null || prevJson.isBlank()) ? mapper.nullNode() : mapper.readTree(prevJson);
            JsonNode curr = mapper.valueToTree(currentObj);
            List<ChangeItem> out = new ArrayList<>();
            walk("", prev, curr, out);
            return out;
        } catch (Exception e) {
            return List.of(ChangeItem.builder()
                    .field("$error")
                    .beforeVal(prevJson)
                    .afterVal("DIFF_FAILED: " + e.getMessage())
                    .changeType("ERROR")
                    .build());
        }
    }

    public static List<ChangeItem> diff(ObjectMapper mapper, String prevJson, String nextJson) {
        try {
            JsonNode prev = (prevJson == null || prevJson.isBlank()) ? mapper.nullNode() : mapper.readTree(prevJson);
            JsonNode next = (nextJson == null || nextJson.isBlank()) ? mapper.nullNode() : mapper.readTree(nextJson);
            List<ChangeItem> out = new ArrayList<>();
            walk("", prev, next, out);
            return out;
        } catch (Exception e) {
            return List.of(ChangeItem.builder()
                    .field("$error")
                    .beforeVal(prevJson)
                    .afterVal("DIFF_FAILED: " + e.getMessage())
                    .changeType("ERROR")
                    .build());
        }
    }

    private static void walk(String path, JsonNode a, JsonNode b, List<ChangeItem> out) {
        if (a == null) a = JsonNodeFactory.instance.nullNode();
        if (b == null) b = JsonNodeFactory.instance.nullNode();

        if (a.isObject() && b.isObject()) {
            Set<String> fields = new TreeSet<>();
            a.fieldNames().forEachRemaining(fields::add);
            b.fieldNames().forEachRemaining(fields::add);
            for (String f : fields) {
                String p = path.isEmpty() ? f : path + "." + f;
                walk(p, a.get(f), b.get(f), out);
            }
        } else if (a.isArray() && b.isArray()) {
            int max = Math.max(a.size(), b.size());
            for (int i = 0; i < max; i++) {
                String p = path + "[" + i + "]";
                walk(p,
                        a.size() > i ? a.get(i) : JsonNodeFactory.instance.nullNode(),
                        b.size() > i ? b.get(i) : JsonNodeFactory.instance.nullNode(),
                        out);
            }
        } else {
            if (!Objects.equals(nodeVal(a), nodeVal(b))) {
                String type = a.isNull() ? "ADDED" : (b.isNull() ? "REMOVED" : "CHANGED");
                out.add(ChangeItem.builder()
                        .field(path)
                        .beforeVal(nodeVal(a))
                        .afterVal(nodeVal(b))
                        .changeType(type)
                        .build());
            }
        }
    }

    private static Object nodeVal(JsonNode n) {
        if (n == null || n.isNull()) return null;
        if (n.isNumber()) return n.numberValue();
        if (n.isBoolean()) return n.booleanValue();
        if (n.isTextual()) return n.textValue();
        return n.toString();
    }
}
