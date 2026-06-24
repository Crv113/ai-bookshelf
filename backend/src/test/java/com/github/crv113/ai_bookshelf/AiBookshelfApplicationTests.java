package com.github.crv113.ai_bookshelf;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class AiBookshelfApplicationTests {

	@Test
	void contextLoads() {
	}

}
