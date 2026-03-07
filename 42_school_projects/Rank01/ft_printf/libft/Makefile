# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: lraghave <marvin@42.fr>                    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/05/27 17:05:39 by lraghave          #+#    #+#              #
#    Updated: 2025/05/29 12:27:57 by lraghave         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #
# Variables
NAME = libft.a
MY_SOURCES = ft_atoi.c \
	     ft_bzero.c \
	     ft_calloc.c \
	     ft_isalnum.c \
	     ft_isalpha.c \
	     ft_isascii.c \
	     ft_isdigit.c \
	     ft_isprint.c \
	     ft_itoa.c \
	     ft_memchr.c \
	     ft_memcmp.c \
	     ft_memcpy.c \
	     ft_memmove.c \
	     ft_memset.c \
	     ft_putchar_fd.c \
	     ft_putendl_fd.c \
	     ft_putnbr_fd.c \
	     ft_putstr_fd.c \
	     ft_split.c \
	     ft_strchr.c \
	     ft_strdup.c \
	     ft_striteri.c \
	     ft_strjoin.c \
	     ft_strlcat.c \
	     ft_strlcpy.c \
	     ft_strlen.c \
	     ft_strmapi.c \
	     ft_strncmp.c \
	     ft_strnstr.c \
	     ft_strrchr.c \
	     ft_strtrim.c \
	     ft_substr.c \
	     ft_tolower.c \
	     ft_toupper.c
MY_SOURCES_BONUS = ft_lstadd_back_bonus.c \
		   ft_lstadd_front_bonus.c \
		   ft_lstclear_bonus.c \
		   ft_lstdelone_bonus.c \
		   ft_lstlast_bonus.c \
		   ft_lstiter_bonus.c \
		   ft_lstmap_bonus.c \
		   ft_lstnew_bonus.c \
		   ft_lstsize_bonus.c
MY_OBJECTS = $(MY_SOURCES:.c=.o)
MY_OBJECTS_BONUS = $(MY_SOURCES_BONUS:.c=.o)
CC = gcc
CFLAGS = -Wall -Wextra -Werror

# Rules
# Declaring the program to be built
all: $(NAME)

# Convert all source files to .o files and then combine them into
# the static library libft.a using ar rcs
$(NAME): $(MY_OBJECTS)
	@ar rcs $(NAME) $(MY_OBJECTS)

bonus: $(MY_OBJECTS_BONUS)
	@ar rcs $(NAME) $(MY_OBJECTS_BONUS)

clean:
	@rm -f $(MY_OBJECTS) $(MY_OBJECTS_BONUS)

fclean: clean
	@rm -f $(NAME)

re: fclean all

.PHONY: all bonus clean fclean re
