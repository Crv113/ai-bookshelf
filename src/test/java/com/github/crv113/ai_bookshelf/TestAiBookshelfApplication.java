package com.github.crv113.ai_bookshelf;

import org.springframework.boot.SpringApplication;

public class TestAiBookshelfApplication {

	public static void main(String[] args) {
		SpringApplication.from(AiBookshelfApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
