package vn.lms.library.web.dto;

public record PageRequest(int page, int size) {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    public PageRequest {
        if (page < 0) {
            page = 0;
        }
        if (size <= 0) {
            size = DEFAULT_SIZE;
        }
        if (size > MAX_SIZE) {
            size = MAX_SIZE;
        }
    }

    public static PageRequest of(Integer page, Integer size) {
        return new PageRequest(page != null ? page : 0, size != null ? size : DEFAULT_SIZE);
    }
}
