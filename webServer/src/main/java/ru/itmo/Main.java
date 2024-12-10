package ru.itmo;

import com.fastcgi.FCGIInterface;
import org.json.JSONObject;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Main {
    private static final String RESPONSE_TEMPLATE = "Content-Type: application/json\nContent-Length: %d\n\n%s";

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            long startTime = System.nanoTime();
            try {
                String body = readRequestBody();
                JSONObject jsonRequest = new JSONObject(body);

                double x = jsonRequest.getDouble("x");
                double y = jsonRequest.getDouble("y");
                double r = jsonRequest.getDouble("r");

                if (!validateInput(x, y, r)) {
                    sendJson(new JSONObject().put("error", "Invalid input values").toString());
                    continue;
                }

                boolean isInside = calculate(x, y, r);
                long endTime = System.nanoTime();

                String date = String.valueOf(LocalDateTime.now().format(formatter));

                String jsonResponse = new JSONObject()
                        .put("result", isInside)
                        .put("x", x)
                        .put("y", y)
                        .put("r", r)
                        .put("currentTime", date)
                        .put("executionTime", (endTime - startTime) + "ns")
                        .toString();
                sendJson(jsonResponse);
            } catch (Exception e) {
                sendJson(new JSONObject().put("error", e.getMessage()).toString());
            }
        }
    }

    private static boolean calculate(double x, double y, double r) {
        if (x >= 0 && y >= 0) {
            return (x * x + y * y <= r * r);
        }
        else if (x <= 0 && y <= 0) {
            return (x >= -r && y <= r / 2);
        }
        else if (x >= 0 && y <= 0) {
            return (y >= -x / 2 - r / 2);
        }
        return false;
    }



    private static void sendJson(String jsonDump) {
        System.out.printf(RESPONSE_TEMPLATE + "%n", jsonDump.getBytes(StandardCharsets.UTF_8).length, jsonDump);
    }

    private static String readRequestBody() throws IOException {
        FCGIInterface.request.inStream.fill();
        int contentLength = FCGIInterface.request.inStream.available();
        var buffer = ByteBuffer.allocate(contentLength);
        var readBytes = FCGIInterface.request.inStream.read(buffer.array(), 0, contentLength);
        var requestBodyRaw = new byte[readBytes];
        buffer.get(requestBodyRaw);
        buffer.clear();
        return new String(requestBodyRaw, StandardCharsets.UTF_8);
    }

    private static boolean validateInput(double x, double y, double r) {
        return (x >= -2 && x <= 2) && (y >= -3 && y <= 5) && (r >= 1 && r <= 3);
    }
}


// ssh -p 2222 -L 40934:localhost:40934 s413044@helios.cs.ifmo.ru
// hEez<2098
// httpd -f ~/httpd-root/conf/httpd.conf -k start
// java -DFCGI_PORT=40954 -jar ~/httpd-root/fcgi-bin/server-1.0.jar