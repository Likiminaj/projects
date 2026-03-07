/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   get_next_line.h                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/09 15:03:12 by lraghave          #+#    #+#             */
/*   Updated: 2025/07/11 13:39:13 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#ifndef GET_NEXT_LINE_H
# define GET_NEXT_LINE_H

# ifndef BUFFER_SIZE
#  define BUFFER_SIZE 10
# endif

# include <unistd.h>
# include <stdlib.h>

char	*get_next_line(int fd);
char	*ft_strdup(const char *s1);
size_t	ft_strlen(const char *str);
ssize_t	ft_newline(const char *s);
void	ft_read_line(int fd, char **stash);
void	ft_cpy_line(char **stash, char **line);
void	ft_create_stash(char **stash, char *str);
char	*ft_strjoin(char const *s1, char const *s2);
void	ft_stash_leftover(char **stash, char **line);

#endif
