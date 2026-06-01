package vn.lms.library.util;

import java.text.Normalizer;
import java.util.Locale;

public final class BookSlugUtils {

    private static final int MAX_LENGTH = 120;

    private BookSlugUtils() {
    }

    public static String toSlug(String title) {
        if (title == null || title.isBlank()) {
            return "book";
        }
        String ascii = Normalizer.normalize(title.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String slug = ascii.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            return "book";
        }
        if (slug.length() > MAX_LENGTH) {
            slug = slug.substring(0, MAX_LENGTH).replaceAll("-+$", "");
        }
        return slug.isBlank() ? "book" : slug;
    }
}
