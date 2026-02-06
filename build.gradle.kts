import java.util.Properties

plugins {
	java
	id("org.springframework.boot") version "3.4.2"
	id("io.spring.dependency-management") version "1.1.7"
	id("net.ltgt.errorprone") version "4.0.0"
	id("com.diffplug.spotless") version "6.25.0"
}

group = "com.agentpassvault"
version = "0.0.1-SNAPSHOT"
description = "AgentPassVault - Secure Secret Manager for Agents"

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
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4")
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	errorprone("com.google.errorprone:error_prone_core:2.26.1")

	// MySQL and JSON support
	runtimeOnly("com.mysql:mysql-connector-j")
	implementation("io.hypersistence:hypersistence-utils-hibernate-63:3.9.0")
	implementation("io.hypersistence:hypersistence-tsid:2.1.1")

 	// JJWT for JWT generation and validation
 	implementation("io.jsonwebtoken:jjwt-api:0.12.3")
 	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.3")
 	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.3")
}

spotless {
	java {
		licenseHeaderFile(file("licence-header.txt"))
		googleJavaFormat()
		removeUnusedImports()
		trimTrailingWhitespace()
		endWithNewline()
	}
}

	tasks.withType<Test> {
	useJUnitPlatform()
	systemProperty("spring.profiles.active", "test")
}
tasks.getByName<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
	systemProperty("spring.profiles.active", "dev")
}
