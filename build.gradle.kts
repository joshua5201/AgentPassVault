import java.util.Properties

plugins {
	java
	id("org.springframework.boot") version "4.0.2"
	id("io.spring.dependency-management") version "1.1.7"
	id("net.ltgt.errorprone") version "4.0.0"
	id("com.diffplug.spotless") version "6.25.0"
	id("com.google.cloud.tools.jib") version "3.4.1"
	id("org.springdoc.openapi-gradle-plugin") version "1.9.0"
	id("org.flywaydb.flyway") version "12.0.1"
}

buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath("com.mysql:mysql-connector-j:9.2.0")
        classpath("org.flywaydb:flyway-mysql:12.0.1")
    }
}

flyway {
    url = "jdbc:mysql://127.0.0.1:53306/agentpassvault_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
    user = "root"
    password = "root"

    baselineOnMigrate = true
}

group = "com.agentpassvault"
version = "0.0.1-SNAPSHOT"
description = "AgentPassVault - Secure Secret Manager for Agents"

openApi {
	apiDocsUrl.set("http://localhost:8080/v3/api-docs.yaml")
	outputDir.set(file("docs"))
	outputFileName.set("openapi.yaml")
	waitTimeInSeconds.set(30)
}

jib {
	from {
		image = "gcr.io/distroless/java21-debian12:nonroot-1d8908e5c48cc27b0e52f67fe8163c6572137506"
	}
	to {
		image = "agentpassvault-backend"
		tags = setOf("latest", version.toString())
	}
	container {
		mainClass = "com.agentpassvault.AgentPassVaultApplication"
		ports = listOf("8080")
		environment = mapOf(
			"SPRING_FLYWAY_ENABLED" to "false"
		)
	}
}

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
	implementation("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server")
	implementation("org.springframework.boot:spring-boot-starter-webmvc")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4")
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
	testImplementation("org.springframework.security:spring-security-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	errorprone("com.google.errorprone:error_prone_core:2.26.1")

	// MySQL and JSON support
	runtimeOnly("com.mysql:mysql-connector-j")
	implementation("com.google.cloud.sql:mysql-socket-factory-connector-j-8:1.28.1")
	implementation("io.hypersistence:hypersistence-utils-hibernate-73:3.15.2")
	implementation("io.hypersistence:hypersistence-tsid:2.1.1")
	implementation("org.springframework.boot:spring-boot-starter-flyway")
	implementation("org.flywaydb:flyway-core:12.0.1")
	implementation("org.flywaydb:flyway-mysql:12.0.1")

 	// JJWT for JWT generation and validation
 	implementation("io.jsonwebtoken:jjwt-api:0.12.3")
 	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.3")
 	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.3")

    // TOTP for 2FA
    implementation("dev.samstevens.totp:totp:1.7.1")
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
	testLogging {
		events("passed", "skipped", "failed")
		showStandardStreams = true
		exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
	}
}

