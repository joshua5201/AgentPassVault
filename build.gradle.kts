plugins {
	java
	id("org.springframework.boot") version "4.0.2"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.agentvault"
version = "0.0.1-SNAPSHOT"
description = "AgentVault - Secure Secret Manager for Agents"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server")
	implementation("org.springframework.boot:spring-boot-starter-webmvc")
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")
	        testImplementation("org.springframework.boot:spring-boot-starter-data-mongodb-test")
	        testImplementation("org.springframework.boot:spring-boot-starter-security-test")
	        testImplementation("org.springframework.boot:spring-boot-starter-test")
	        testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	}
tasks.withType<Test> {
	useJUnitPlatform()
}
