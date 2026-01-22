/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_memset.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/12 14:52:16 by lraghave          #+#    #+#             */
/*   Updated: 2025/05/21 20:40:23 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

void	*ft_memset(void *s, int c, size_t n)
{
	size_t			i;
	unsigned char	*ptr;

	i = 0;
	ptr = (unsigned char *)s;
	while (i < n)
	{
		ptr[i] = (unsigned char)c;
		i++;
	}
	return (s);
}
/*
#include <stdio.h>
#include <string.h>

void *ft_memset(void *s, int c, size_t n);

int main(void) {
    // Test 1: Basic string overwrite
    char str1[20] = "Hello, World!";
    printf("Test 1 - Basic functionality:\n");
    printf("Before: %s\n", str1);
    ft_memset(str1, 'x', 5);
    printf("After:  %s\n", str1);
    printf("Expected: xxxxx, World!\n\n");

    // Test 2: Zero length (no change)
    char str2[20] = "Hello";
    printf("Test 2 - Zero length:\n");
    printf("Before: %s\n", str2);
    ft_memset(str2, 'A', 0);
    printf("After:  %s\n", str2);
    printf("Expected: Hello\n\n");

    // Test 3: Full string overwrite
    char str3[20] = "Test string";
    printf("Test 3 - Full overwrite:\n");
    printf("Before: %s\n", str3);
    ft_memset(str3, '.', strlen(str3));
    printf("After:  %s\n", str3);
    printf("Expected: ............\n\n");

    // Test 4: Integer array zeroing
    int arr1[5] = {1, 2, 3, 4, 5};
    printf("Test 4 - Integer array zeroing:\n");
    printf("Before: ");
    for (int i = 0; i < 5; i++) printf("%d ", arr1[i]);
    ft_memset(arr1, 0, sizeof(arr1));
    printf("\nAfter:  ");
    for (int i = 0; i < 5; i++) printf("%d ", arr1[i]);
    printf("\nExpected: 0 0 0 0 0\n\n");

    // Test 5: Partial array overwrite
    int arr2[5] = {1, 2, 3, 4, 5};
    printf("Test 5 - Partial overwrite:\n");
    printf("Before: ");
    for (int i = 0; i < 5; i++) printf("%d ", arr2[i]);
    ft_memset(arr2, 255, 2 * sizeof(int));
    printf("\nAfter:  ");
    for (int i = 0; i < 5; i++) printf("%d ", arr2[i]);
    printf("\nExpected: First two elements changed, rest unchanged\n\n");

    // Test 6: Non-ASCII value (truncation)
    unsigned char arr3[10];
    printf("Test 6 - Non-ASCII value:\n");
    printf("Result: ");
    ft_memset(arr3, 300, 10); // 300 % 256 = 44
    for (int i = 0; i < 10; i++) {
        printf("%d ", arr3[i]);
    }
    printf("\nExpected: 44 44 44 44 44 44 44 44 44 44\n\n");

    // Test 7: Memory allocation test
    printf("Test 7 - Dynamic memory:\n");
    char *dynamic = malloc(100);
    ft_memset(dynamic, 'Z', 100);
    printf("First char: %c, Last char: %c\n", dynamic[0], dynamic[99]);
    printf("Expected: Z Z\n");
    free(dynamic);

    return 0;
}
*/
