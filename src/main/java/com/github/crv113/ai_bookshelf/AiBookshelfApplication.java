package com.github.crv113.ai_bookshelf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class AiBookshelfApplication {

	public static void main(String[] args) {
		SpringApplication.run(AiBookshelfApplication.class, args);
	}

}
